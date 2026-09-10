import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// On Vercel (and other serverless platforms), the deployment root is read-only.
// Only /tmp is writable. Detect this by checking if we're in a read-only environment
// and fall back to os.tmpdir() so the server can still start.
function resolveDataDir(): string {
  // Prefer an explicit env override (e.g. for local dev or a persistent mount)
  if (process.env.DATA_DIR) return process.env.DATA_DIR;

  const candidate = path.resolve(ROOT_DIR, 'data');

  // If the candidate directory already exists and is writable, use it
  try {
    fs.accessSync(candidate, fs.constants.W_OK);
    return candidate;
  } catch {
    // Directory doesn't exist — try to check if the parent is writable
    try {
      fs.accessSync(path.dirname(candidate), fs.constants.W_OK);
      return candidate; // We'll create it in ensureDataDir
    } catch {
      // Parent is also read-only (Vercel /var/task) — fall back to /tmp
      return path.join(os.tmpdir(), 'spork-data');
    }
  }
}

const DATA_DIR = resolveDataDir();

const paths = {
  rootDir: ROOT_DIR,
  dataDir: DATA_DIR,
  dbPath: path.join(DATA_DIR, 'spork.db'),
  factoryDir: path.join(ROOT_DIR, 'app', 'factory'),
  baseApkPath: path.join(ROOT_DIR, 'app', 'factory', 'baseApp', 'Fason.apk'),
  signerPath: path.join(ROOT_DIR, 'app', 'factory', 'uber-apk-signer.jar'),
  workDir: path.join(DATA_DIR, 'build', 'work'),
};

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // On read-only filesystems (Vercel serverless) this is non-fatal since
    // we use PostgreSQL — no local file DB is needed. Log a warning and continue.
    console.warn(`[paths] Could not create data dir "${DATA_DIR}": ${err instanceof Error ? err.message : String(err)}. This is expected on serverless deployments.`);
  }
}

function createBuildDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spork-build-'));
}

export { paths, ensureDataDir, createBuildDir };
