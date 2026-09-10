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
  async getOrCreateClientData(clientId: string, dataType: string): Promise<string> {
    const d = getDb();
    const row = (await d.select({ data: clientData.data })
          .from(clientData)
          .where(and(eq(clientData.clientId, clientId), eq(clientData.dataType, dataType))).limit(1))[0];
    if (row) return row.data ?? '[]';
    await d.insert(clientData).values({ clientId, dataType, data: '[]' })
              .onConflictDoNothing();
    const retry = (await d.select({ data: clientData.data })
          .from(clientData)
          .where(and(eq(clientData.clientId, clientId), eq(clientData.dataType, dataType))).limit(1))[0];
    return retry?.data ?? '[]';
  },

  async setClientData(clientId: string, dataType: string, data: string): Promise<void> {
    await getDb().insert(clientData).values({ clientId, dataType, data })
            .onConflictDoUpdate({
              target: [clientData.clientId, clientData.dataType],
              set: { data, updatedAt: new Date().toISOString() },
            });
  },

  async addClientFile(clientId: string, fileType: string, originalName: string, mimeType: string, data: Buffer, fileSize: number): Promise<void> {
    const d = getDb();
    await d.insert(clientFiles).values({
            clientId, fileType, originalName, mimeType, data, fileSize,
          });
  },

  async getClientFiles(clientId: string, fileType: string): Promise<Array<{
      id: number; originalName: string; mimeType: string | null; fileSize: number | null; createdAt: string | null; fileType: string;
    }>> {
    const d = getDb();
    return (await d.select({
          id: clientFiles.id,
          originalName: clientFiles.originalName,
          mimeType: clientFiles.mimeType,
          fileSize: clientFiles.fileSize,
          createdAt: clientFiles.createdAt,
          fileType: clientFiles.fileType,
        })
          .from(clientFiles)
          .where(and(eq(clientFiles.clientId, clientId), eq(clientFiles.fileType, fileType)))
          .orderBy(desc(clientFiles.createdAt)));
  },

  async addLog(type: string, category: string, message: string, details?: string): Promise<void> {
    const d = getDb();
    await d.insert(logs).values({ type, category, message, details: details || null });
    logPruneCounter++;
    if (logPruneCounter >= 100) {
      logPruneCounter = 0;
      const cutoffRow = (await d.select({ createdAt: logs.createdAt })
              .from(logs)
              .orderBy(desc(logs.createdAt))
              .limit(1)
              .offset(9999));
      if (cutoffRow.length > 0) {
        const cutoff = cutoffRow[0].createdAt;
        if (cutoff) await d.delete(logs).where(lt(logs.createdAt, cutoff));
      }
    }
  },

  async cleanExpiredSessions(): Promise<number> {
    const d = getDb();
    const now = new Date();
    const result = await d.delete(session).where(lt(session.expiresAt, now));
    return result.rowCount;
  },

  async checkLoginAttempts(ip: string, maxAttempts: number, windowMs: number, identifier?: string): Promise<boolean> {
    const d = getDb();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const id = identifier || ip;
    const result = (await d.select({ count: count() })
          .from(loginAttempts)
          .where(and(eq(loginAttempts.identifier, id), gt(loginAttempts.attemptedAt, cutoff))).limit(1))[0];
    return (result?.count ?? 0) >= maxAttempts;
  },

  async recordLoginAttempt(ip: string, identifier?: string): Promise<void> {
    const d = getDb();
    const id = identifier || ip;
    await d.insert(loginAttempts).values({ ip, identifier: id });
  },

  async cleanLoginAttempts(olderThanMs: number): Promise<number> {
    const d = getDb();
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    const result = await d.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, cutoff));
    return result.rowCount;
  },

  async getOrCreateJwtSecret(): Promise<string> {
    if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
    try {
      const d = getDb();
      const row = (await d.select({ secret: jwtSecret.secret })
              .from(jwtSecret)
              .where(eq(jwtSecret.id, 1)).limit(1))[0];
      if (row?.secret && row.secret.length >= 32) return row.secret;
      const secret = crypto.randomBytes(48).toString('base64url');
      await d.insert(jwtSecret).values({ id: 1, secret })
                .onConflictDoUpdate({ target: jwtSecret.id, set: { secret } });
      return secret;
    } catch {
      log.error('No auth secret in DB, using ephemeral');
      return crypto.randomBytes(48).toString('base64url');
    }
  },

  async getUserByUsernameOrEmail(identifier: string): Promise<typeof schema.user.$inferSelect | undefined> {
    const d = getDb();
    const lowerIdent = identifier.toLowerCase();
    return (await d.select().from(user).where(
          or(
            eq(sql`LOWER(${user.username})`, lowerIdent),
            eq(sql`LOWER(${user.email})`, lowerIdent),
          )
        ).limit(1))[0];
  },

  async getUserById(id: string): Promise<typeof schema.user.$inferSelect | undefined> {
    const d = getDb();
    return (await d.select().from(user).where(eq(user.id, id)).limit(1))[0];
  },

  async getAllUsers(): Promise<Array<typeof schema.user.$inferSelect>> {
    const d = getDb();
    return (await d.select({
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
        }).from(user).orderBy(desc(user.createdAt)));
  },

  async updateUser(id: string, data: { username?: string; email?: string; role?: 'admin' | 'user'; permissions?: string; isDefault?: number; lastLogin?: Date }): Promise<boolean> {
    const d = getDb();
    const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };

    const result = await d.update(user).set(updates as any).where(eq(user.id, id));
    return result.rowCount > 0;
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const d = getDb();
    const result = await d.update(account).set({ password: passwordHash, updatedAt: new Date() })
          .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')));
    return result.rowCount > 0;
  },

  async deleteUser(id: string): Promise<string[]> {
    const d = getDb();
    const affectedDevices = (await d.select({ id: clients.id }).from(clients).where(eq(clients.ownerId, id)));
    await d.transaction(async (tx) => {
      await tx.update(clients).set({ ownerId: null }).where(eq(clients.ownerId, id));
      await tx.delete(buildRecords).where(eq(buildRecords.userId, id));
      await tx.delete(user).where(eq(user.id, id));
    });
    deviceSecretsCache = null;
    return affectedDevices.map(d => d.id);
  },

  async getAdminCount(): Promise<number> {
    const d = getDb();
    const result = (await d.select({ count: count() }).from(user).where(eq(user.role, 'admin')).limit(1))[0];
    return result?.count ?? 0;
  },

  async getUserPermissions(id: string): Promise<Permission[]> {
    const d = getDb();
    const row = (await d.select({ role: user.role, permissions: user.permissions }).from(user).where(eq(user.id, id)).limit(1))[0];
    if (!row) return [];
    return resolvePermissions(row.role as UserRole, row.permissions);
  },

  async getUserSessions(userId: string): Promise<Array<typeof schema.session.$inferSelect>> {
    const d = getDb();
    const now = new Date();
    return (await d.select().from(session)
          .where(and(eq(session.userId, userId), gt(session.expiresAt, now)))
          .orderBy(desc(session.createdAt)));
  },

  async getSessionByToken(token: string): Promise<typeof schema.session.$inferSelect | null> {
    const d = getDb();
    const row = (await d.select().from(session).where(eq(session.token, token)).limit(1))[0];
    if (!row) return null;
    const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt as any);
    if (expiresAt < new Date()) {
      await d.delete(session).where(eq(session.id, row.id));
      return null;
    }
    return row;
  },

  async deleteSessionById(sessionId: string): Promise<boolean> {
    const d = getDb();
    const result = await d.delete(session).where(eq(session.id, sessionId));
    return result.rowCount > 0;
  },

  async deleteOtherSessions(userId: string, keepToken: string): Promise<number> {
    const d = getDb();
    const result = await d.delete(session)
          .where(and(eq(session.userId, userId), ne(session.token, keepToken)));
    return result.rowCount;
  },

  async createCommand(id: string, clientId: string, cmdType: string, params: string): Promise<void> {
    await getDb().insert(commands).values({ id, clientId, cmdType, params, status: 'sent' });
  },

  async updateCommandStatus(id: string, status: 'delivered' | 'responded' | 'failed', summary?: string): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === 'delivered') updates.deliveredAt = new Date().toISOString();
    if (status === 'responded') {
      updates.respondedAt = new Date().toISOString();
      if (summary) updates.responseSummary = summary;
    }
    await getDb().update(commands).set(updates).where(eq(commands.id, id));
  },

  async getPendingCommandForClient(clientId: string, cmdType: string): Promise<{ id: string; status: string } | undefined> {
    const d = getDb();
    return (await d.select({ id: commands.id, status: commands.status })
          .from(commands)
          .where(and(eq(commands.clientId, clientId), eq(commands.cmdType, cmdType), inArray(commands.status, ['sent', 'delivered'])))
          .orderBy(desc(commands.sentAt))
          .limit(1))[0];
  },

  async markAllPendingCommandsResponded(clientId: string, cmdType: string, summary?: string): Promise<string[]> {
    const d = getDb();
    const pending = (await d.select({ id: commands.id })
          .from(commands)
          .where(and(eq(commands.clientId, clientId), eq(commands.cmdType, cmdType), inArray(commands.status, ['sent', 'delivered']))));
    if (pending.length === 0) return [];
    const ids = pending.map((p) => p.id);
    const nowIso = new Date().toISOString();
    await d.update(commands).set({
            status: 'responded',
            respondedAt: nowIso,
            responseSummary: summary ?? null,
          }).where(and(
            eq(commands.clientId, clientId),
            eq(commands.cmdType, cmdType),
            inArray(commands.id, ids),
          ));
    return ids;
  },

  async markCommandResponded(commandId: string, summary?: string): Promise<boolean> {
    const d = getDb();
    const nowIso = new Date().toISOString();
    const result = await d.update(commands).set({
          status: 'responded',
          respondedAt: nowIso,
          responseSummary: summary ?? null,
        }).where(eq(commands.id, commandId));
    return result.rowCount > 0;
  },

  async cleanOldCommands(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const d = getDb();
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const result = await d.delete(commands).where(lt(commands.sentAt, cutoff));
    return result.rowCount;
  },

  async assignDevice(clientId: string, ownerId: string): Promise<boolean> {
    const d = getDb();
    const result = await d.update(clients).set({ ownerId }).where(eq(clients.id, clientId));
    return result.rowCount > 0;
  },

  async unassignDevice(clientId: string): Promise<boolean> {
    const d = getDb();
    const result = await d.update(clients).set({ ownerId: null }).where(eq(clients.id, clientId));
    return result.rowCount > 0;
  },

  async getDeviceOwnerId(clientId: string): Promise<string | null> {
    const d = getDb();
    const row = (await d.select({ ownerId: clients.ownerId }).from(clients).where(eq(clients.id, clientId)).limit(1))[0];
    return row?.ownerId ?? null;
  },

  async getOrCreateUserDeviceSecret(userId: string): Promise<string> {
    const d = getDb();
    const row = (await d.select({ deviceSecret: user.deviceSecret }).from(user).where(eq(user.id, userId)).limit(1))[0];
    if (row?.deviceSecret) {
      if (deviceSecretsCache) deviceSecretsCache.set(userId, row.deviceSecret);
      return row.deviceSecret;
    }
    const secret = crypto.randomBytes(24).toString('base64url');
    await d.update(user).set({ deviceSecret: secret, updatedAt: new Date() }).where(eq(user.id, userId));
    if (deviceSecretsCache) deviceSecretsCache.set(userId, secret);
    return secret;
  },

  async getAllDeviceSecrets(): Promise<Array<{ userId: string; deviceSecret: string }>> {
    if (deviceSecretsCache) {
      return Array.from(deviceSecretsCache.entries()).map(([userId, deviceSecret]) => ({ userId, deviceSecret }));
    }
    const d = getDb();
    const rows = (await d.select({ userId: user.id, deviceSecret: user.deviceSecret })
          .from(user))
      .filter((r): r is { userId: string; deviceSecret: string } => !!r.deviceSecret);
    deviceSecretsCache = new Map(rows.map(r => [r.userId, r.deviceSecret]));
    return rows;
  },

  invalidateDeviceSecretsCache(): void {
    deviceSecretsCache = null;
  },
};
