import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { clients, logs, user as userTable } from '../db/schema.js';
import { eq, desc, count, gte, or, isNull, and } from 'drizzle-orm';
import { formatClient } from './device.js';
import { requirePermission, getRequestUser } from '../middleware/auth.js';
import type { SessionUser } from '../types/index.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard', {
    preHandler: [app.auth, requirePermission('dashboard:view')],
  }, async (request) => {
    const user = getRequestUser(request);
    const d = getDb();
    const ownerFilter = user.role === 'admin'
      ? undefined
      : eq(clients.ownerId, user.userId);
    const onlineClients = (await d.select().from(clients)
          .where(ownerFilter ? and(eq(clients.online, true), ownerFilter) : eq(clients.online, true))
          .orderBy(desc(clients.lastSeen)));
    const offlineClients = (await d.select().from(clients)
          .where(ownerFilter ? and(eq(clients.online, false), ownerFilter) : eq(clients.online, false))
          .orderBy(desc(clients.lastSeen)));
    const totalLogsResult = (await d.select({ count: count() }).from(logs).limit(1))[0];
    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayLogsResult = (await d.select({ count: count() }).from(logs).where(gte(logs.createdAt, todayStart)).limit(1))[0];
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const isAdmin = user.role === 'admin';
    return {
      success: true,
      data: {
        onlineClients: onlineClients.map(formatClient),
        offlineClients: offlineClients.map(formatClient),
        stats: {
          totalClients: onlineClients.length + offlineClients.length,
          onlineClients: onlineClients.length,
          offlineClients: offlineClients.length,
          totalLogs: isAdmin ? (totalLogsResult?.count ?? 0) : undefined,
          todayLogs: isAdmin ? (todayLogsResult?.count ?? 0) : undefined,
          totalUsers: isAdmin ? ((await d.select({ count: count() }).from(userTable).limit(1))[0]?.count ?? 0) : undefined,
          totalAdmins: isAdmin ? ((await d.select({ count: count() }).from(userTable).where(eq(userTable.role, 'admin')).limit(1))[0]?.count ?? 0) : undefined,
          uptime: Math.floor(uptime),
          memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
    };
  });
}
