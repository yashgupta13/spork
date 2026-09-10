import fs from 'fs';

// 1. auth/index.ts
let p = fs.readFileSync('src/auth/index.ts', 'utf8');
p = p.replace("provider: 'postgres',", "provider: 'pg',");
// readOrCreateSecret is called in auth object. Let's make it top-level await?
p = p.replace('secret: readOrCreateSecret(),', 'secret: await readOrCreateSecret(),');
fs.writeFileSync('src/auth/index.ts', p);

// 2. db/index.ts
p = fs.readFileSync('src/db/index.ts', 'utf8');
p = p.replace('.limit(1).limit(1)', '.limit(1)');
fs.writeFileSync('src/db/index.ts', p);

// 3. routes/device.ts
p = fs.readFileSync('src/routes/device.ts', 'utf8');
p = p.replace('async function canAccessDevice(user: { userId: string; role: string }, clientId: string): boolean {', 'async function canAccessDevice(user: { userId: string; role: string }, clientId: string): Promise<boolean> {');
fs.writeFileSync('src/routes/device.ts', p);

// 4. routes/files.ts
p = fs.readFileSync('src/routes/files.ts', 'utf8');
p = p.replace('async function canAccessDevice(user: SessionUser, clientId: string): boolean {', 'async function canAccessDevice(user: SessionUser, clientId: string): Promise<boolean> {');
fs.writeFileSync('src/routes/files.ts', p);

// 5. services/socket.ts
p = fs.readFileSync('src/services/socket.ts', 'utf8');
p = p.replace('async initialize(httpServer: HttpServer, fastifyApp: FastifyInstance): void {', 'async initialize(httpServer: HttpServer, fastifyApp: FastifyInstance): Promise<void> {');
p = p.replace('private async ensureClientData(clientId: string): void {', 'private async ensureClientData(clientId: string): Promise<void> {');
p = p.replace('private async saveFileToDb(clientId: string, fileType: string, buffer: Buffer, originalName: string): void {', 'private async saveFileToDb(clientId: string, fileType: string, buffer: Buffer, originalName: string): Promise<void> {');
p = p.replace('private async completeTransfer(id: string, transfer: TransferChunk, fileType: string, dataType: string): void {', 'private async completeTransfer(id: string, transfer: TransferChunk, fileType: string, dataType: string): Promise<void> {');
p = p.replace('private async markCommandResponded(clientId: string, cmdType: CmdType, summary?: string): void {', 'private async markCommandResponded(clientId: string, cmdType: CmdType, summary?: string): Promise<void> {');
p = p.replace('async send(clientId: string, cmd: CmdType, params: Record<string, unknown> = {}): { sent: boolean; commandId: string } {', 'async send(clientId: string, cmd: CmdType, params: Record<string, unknown> = {}): Promise<{ sent: boolean; commandId: string }> {');
p = p.replace('private async queueCommand(clientId: string, cmd: CmdType, params: Record<string, unknown>, commandId?: string): void {', 'private async queueCommand(clientId: string, cmd: CmdType, params: Record<string, unknown>, commandId?: string): Promise<void> {');
p = p.replace('private async runQueuedCommands(clientId: string): void {', 'private async runQueuedCommands(clientId: string): Promise<void> {');
p = p.replace('async broadcastToDeviceOwner(deviceId: string, event: string, data: any): void {', 'async broadcastToDeviceOwner(deviceId: string, event: string, data: any): Promise<void> {');
p = p.replace('async broadcastToDeviceOwnerBinary(deviceId: string, event: string, meta: any, binary?: Buffer): void {', 'async broadcastToDeviceOwnerBinary(deviceId: string, event: string, meta: any, binary?: Buffer): Promise<void> {');
fs.writeFileSync('src/services/socket.ts', p);

// 6. services/tasks.ts
p = fs.readFileSync('src/services/tasks.ts', 'utf8');
p = p.replace('if (deleted > 0) log.info(`Cleaned ${deleted} stale clients`);', 'if ((await deleted) > 0) log.info(`Cleaned ${await deleted} stale clients`);');
fs.writeFileSync('src/services/tasks.ts', p);

