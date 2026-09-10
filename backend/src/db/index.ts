import crypto from 'crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, count, lt, gt, inArray, or, ne } from 'drizzle-orm';
import * as schema from './schema.js';
import { paths, ensureDataDir } from '../config/paths.js';
import { log } from '../utils/logger.js';
import {
  user,
  session,
  account,
  clients,
  clientData,
  clientFiles,
  logs,
  buildRecords,
  settings,
  loginAttempts,
  commands,
  jwtSecret,
} from './schema.js';
import { ALL_PERMISSIONS, DEFAULT_USER_PERMISSIONS, resolvePermissions } from '../types/index.js';
import type { Permission, UserRole } from '../types/index.js';

export type DB = ReturnType<typeof drizzle<typeof schema>>;
let dbInstance: DB | null = null;
let logPruneCounter = 0;
let deviceSecretsCache: Map<string, string> | null = null;

export function getDb(): DB {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}

export function initDb(): DB {
  const rawUrl = process.env.POSTGRES_URL || '';
  const safeUrl = rawUrl.split('?')[0];
  
  const pool = new Pool({
    connectionString: safeUrl,
    ssl: { rejectUnauthorized: false },
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.stack);
    } else {
      console.log('Connected to PostgreSQL database');
    }
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export function closeDb(): void {
  // Note: In a serverless environment like Vercel, we don't need to explicitly close the pool
  // as the function instance is short-lived. However, for completeness:
  if (dbInstance) {
    // The drizzle instance doesn't expose a direct way to close the underlying pool
    // In a long-running server, we'd need to keep a reference to the pool
    // For now, we'll just nullify the instance
    dbInstance = null;
  }
}

export const dbHelpers = {
  getOrCreateClientData(clientId: string, dataType: string): string {
    const d = getDb();
    const row = d.select({ data: clientData.data })
      .from(clientData)
      .where(and(eq(clientData.clientId, clientId), eq(clientData.dataType, dataType)))
      .get();
    if (row) return row.data ?? '[]';
    d.insert(clientData).values({ clientId, dataType, data: '[]' })
      .onConflictDoNothing().run();
    const retry = d.select({ data: clientData.data })
      .from(clientData)
      .where(and(eq(clientData.clientId, clientId), eq(clientData.dataType, dataType)))
      .get();
    return retry?.data ?? '[]';
  },

  setClientData(clientId: string, dataType: string, data: string): void {
    getDb().insert(clientData).values({ clientId, dataType, data })
      .onConflictDoUpdate({
        target: [clientData.clientId, clientData.dataType],
        set: { data, updatedAt: new Date().toISOString() },
      }).run();
  },

  addClientFile(clientId: string, fileType: string, originalName: string, mimeType: string, data: Buffer, fileSize: number): void {
    const d = getDb();
    d.insert(clientFiles).values({
      clientId, fileType, originalName, mimeType, data, fileSize,
    }).run();
  },

  getClientFiles(clientId: string, fileType: string): Array<{
    id: number; originalName: string; mimeType: string | null; fileSize: number | null; createdAt: string | null; fileType: string;
  }> {
    const d = getDb();
    return d.select({
      id: clientFiles.id,
      originalName: clientFiles.originalName,
      mimeType: clientFiles.mimeType,
      fileSize: clientFiles.fileSize,
      createdAt: clientFiles.createdAt,
      fileType: clientFiles.fileType,
    })
      .from(clientFiles)
      .where(and(eq(clientFiles.clientId, clientId), eq(clientFiles.fileType, fileType)))
      .orderBy(desc(clientFiles.createdAt))
      .all();
  },

  addLog(type: string, category: string, message: string, details?: string): void {
    const d = getDb();
    d.insert(logs).values({ type, category, message, details: details || null }).run();
    logPruneCounter++;
    if (logPruneCounter >= 100) {
      logPruneCounter = 0;
      const cutoffRow = d.select({ createdAt: logs.createdAt })
        .from(logs)
        .orderBy(desc(logs.createdAt))
        .limit(1)
        .offset(9999)
        .all();
      if (cutoffRow.length > 0) {
        const cutoff = cutoffRow[0].createdAt;
        if (cutoff) d.delete(logs).where(lt(logs.createdAt, cutoff)).run();
      }
    }
  },

  cleanExpiredSessions(): number {
    const d = getDb();
    const now = new Date();
    const result = d.delete(session).where(lt(session.expiresAt, now)).run();
    return result.changes;
  },

  checkLoginAttempts(ip: string, maxAttempts: number, windowMs: number, identifier?: string): boolean {
    const d = getDb();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const id = identifier || ip;
    const result = d.select({ count: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.identifier, id), gt(loginAttempts.attemptedAt, cutoff)))
      .get();
    return (result?.count ?? 0) >= maxAttempts;
  },

  recordLoginAttempt(ip: string, identifier?: string): void {
    const d = getDb();
    const id = identifier || ip;
    d.insert(loginAttempts).values({ ip, identifier: id }).run();
  },

  cleanLoginAttempts(olderThanMs: number): number {
    const d = getDb();
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    const result = d.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, cutoff)).run();
    return result.changes;
  },

  getOrCreateJwtSecret(): string {
    if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
    try {
      const d = getDb();
      const row = d.select({ secret: jwtSecret.secret })
        .from(jwtSecret)
        .where(eq(jwtSecret.id, 1))
        .get();
      if (row?.secret && row.secret.length >= 32) return row.secret;
      const secret = crypto.randomBytes(48).toString('base64url');
      d.insert(jwtSecret).values({ id: 1, secret })
        .onConflictDoUpdate({ target: jwtSecret.id, set: { secret } }).run();
      return secret;
    } catch {
      log.error('No auth secret in DB, using ephemeral');
      return crypto.randomBytes(48).toString('base64url');
    }
  },

  getUserByUsernameOrEmail(identifier: string): typeof schema.user.$inferSelect | undefined {
    const d = getDb();
    const lowerIdent = identifier.toLowerCase();
    return d.select().from(user).where(
      or(
        eq(sql`LOWER(${user.username})`, lowerIdent),
        eq(sql`LOWER(${user.email})`, lowerIdent),
      )
    ).get();
  },

  getUserById(id: string): typeof schema.user.$inferSelect | undefined {
    const d = getDb();
    return d.select().from(user).where(eq(user.id, id)).get();
  },

  getAllUsers(): Array<typeof schema.user.$inferSelect> {
    const d = getDb();
    return d.select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      username: user.username,
      permissions: user.permissions,
      isDefault: user.isDefault,
      lastLogin: user.lastLogin,
      deviceSecret: user.deviceSecret,
    }).from(user).orderBy(desc(user.createdAt)).all();
  },

  updateUser(id: string, data: { username?: string; email?: string; role?: 'admin' | 'user'; permissions?: string; isDefault?: number; lastLogin?: Date }): boolean {
    const d = getDb();
    const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };

    const result = d.update(user).set(updates as any).where(eq(user.id, id)).run();
    return result.changes > 0;
  },

  updateUserPassword(userId: string, passwordHash: string): boolean {
    const d = getDb();
    const result = d.update(account).set({ password: passwordHash, updatedAt: new Date() })
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential'))).run();
    return result.changes > 0;
  },

  async deleteUser(id: string): Promise<string[]> {
    const d = getDb();
    const affectedDevices = d.select({ id: clients.id }).from(clients).where(eq(clients.ownerId, id)).all();
    await d.transaction(async (tx) => {
      await tx.update(clients).set({ ownerId: null }).where(eq(clients.ownerId, id));
      await tx.delete(buildRecords).where(eq(buildRecords.userId, id));
      await tx.delete(user).where(eq(user.id, id));
    });
    deviceSecretsCache = null;
    return affectedDevices.map(d => d.id);
  },

  getAdminCount(): number {
    const d = getDb();
    const result = d.select({ count: count() }).from(user).where(eq(user.role, 'admin')).get();
    return result?.count ?? 0;
  },

  getUserPermissions(id: string): Permission[] {
    const d = getDb();
    const row = d.select({ role: user.role, permissions: user.permissions }).from(user).where(eq(user.id, id)).get();
    if (!row) return [];
    return resolvePermissions(row.role as UserRole, row.permissions);
  },

  getUserSessions(userId: string): Array<typeof schema.session.$inferSelect> {
    const d = getDb();
    const now = new Date();
    return d.select().from(session)
      .where(and(eq(session.userId, userId), gt(session.expiresAt, now)))
      .orderBy(desc(session.createdAt))
      .all();
  },

  getSessionByToken(token: string): typeof schema.session.$inferSelect | null {
    const d = getDb();
    const row = d.select().from(session).where(eq(session.token, token)).get();
    if (!row) return null;
    const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt as any);
    if (expiresAt < new Date()) {
      d.delete(session).where(eq(session.id, row.id)).run();
      return null;
    }
    return row;
  },

  deleteSessionById(sessionId: string): boolean {
    const d = getDb();
    const result = d.delete(session).where(eq(session.id, sessionId)).run();
    return result.changes > 0;
  },

  deleteOtherSessions(userId: string, keepToken: string): number {
    const d = getDb();
    const result = d.delete(session)
      .where(and(eq(session.userId, userId), ne(session.token, keepToken)))
      .run();
    return result.changes;
  },

  createCommand(id: string, clientId: string, cmdType: string, params: string): void {
    getDb().insert(commands).values({ id, clientId, cmdType, params, status: 'sent' }).run();
  },

  updateCommandStatus(id: string, status: 'delivered' | 'responded' | 'failed', summary?: string): void {
    const updates: Record<string, unknown> = { status };
    if (status === 'delivered') updates.deliveredAt = new Date().toISOString();
    if (status === 'responded') {
      updates.respondedAt = new Date().toISOString();
      if (summary) updates.responseSummary = summary;
    }
    getDb().update(commands).set(updates).where(eq(commands.id, id)).run();
  },

  getPendingCommandForClient(clientId: string, cmdType: string): { id: string; status: string } | undefined {
    const d = getDb();
    return d.select({ id: commands.id, status: commands.status })
      .from(commands)
      .where(and(eq(commands.clientId, clientId), eq(commands.cmdType, cmdType), inArray(commands.status, ['sent', 'delivered'])))
      .orderBy(desc(commands.sentAt))
      .limit(1)
      .get();
  },

  markAllPendingCommandsResponded(clientId: string, cmdType: string, summary?: string): string[] {
    const d = getDb();
    const pending = d.select({ id: commands.id })
      .from(commands)
      .where(and(eq(commands.clientId, clientId), eq(commands.cmdType, cmdType), inArray(commands.status, ['sent', 'delivered'])))
      .all();
    if (pending.length === 0) return [];
    const ids = pending.map((p) => p.id);
    const nowIso = new Date().toISOString();
    d.update(commands).set({
      status: 'responded',
      respondedAt: nowIso,
      responseSummary: summary ?? null,
    }).where(and(
      eq(commands.clientId, clientId),
      eq(commands.cmdType, cmdType),
      inArray(commands.id, ids),
    )).run();
    return ids;
  },

  markCommandResponded(commandId: string, summary?: string): boolean {
    const d = getDb();
    const nowIso = new Date().toISOString();
    const result = d.update(commands).set({
      status: 'responded',
      respondedAt: nowIso,
      responseSummary: summary ?? null,
    }).where(eq(commands.id, commandId)).run();
    return result.changes > 0;
  },

  cleanOldCommands(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const d = getDb();
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const result = d.delete(commands).where(lt(commands.sentAt, cutoff)).run();
    return result.changes;
  },

  assignDevice(clientId: string, ownerId: string): boolean {
    const d = getDb();
    const result = d.update(clients).set({ ownerId }).where(eq(clients.id, clientId)).run();
    return result.changes > 0;
  },

  unassignDevice(clientId: string): boolean {
    const d = getDb();
    const result = d.update(clients).set({ ownerId: null }).where(eq(clients.id, clientId)).run();
    return result.changes > 0;
  },

  getDeviceOwnerId(clientId: string): string | null {
    const d = getDb();
    const row = d.select({ ownerId: clients.ownerId }).from(clients).where(eq(clients.id, clientId)).get();
    return row?.ownerId ?? null;
  },

  getOrCreateUserDeviceSecret(userId: string): string {
    const d = getDb();
    const row = d.select({ deviceSecret: user.deviceSecret }).from(user).where(eq(user.id, userId)).get();
    if (row?.deviceSecret) {
      if (deviceSecretsCache) deviceSecretsCache.set(userId, row.deviceSecret);
      return row.deviceSecret;
    }
    const secret = crypto.randomBytes(24).toString('base64url');
    d.update(user).set({ deviceSecret: secret, updatedAt: new Date() }).where(eq(user.id, userId)).run();
    if (deviceSecretsCache) deviceSecretsCache.set(userId, secret);
    return secret;
  },

  getAllDeviceSecrets(): Array<{ userId: string; deviceSecret: string }> {
    if (deviceSecretsCache) {
      return Array.from(deviceSecretsCache.entries()).map(([userId, deviceSecret]) => ({ userId, deviceSecret }));
    }
    const d = getDb();
    const rows = d.select({ userId: user.id, deviceSecret: user.deviceSecret })
      .from(user)
      .all()
      .filter((r): r is { userId: string; deviceSecret: string } => !!r.deviceSecret);
    deviceSecretsCache = new Map(rows.map(r => [r.userId, r.deviceSecret]));
    return rows;
  },

  invalidateDeviceSecretsCache(): void {
    deviceSecretsCache = null;
  },
};
