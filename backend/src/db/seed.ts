import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { getDb } from './index.js';
import { user as userTable, account as accountTable, settings } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '../auth/index.js';
import { ALL_PERMISSIONS } from '../types/index.js';
import type { UserRole } from '../types/index.js';
import { log } from '../utils/logger.js';
import crypto from 'crypto';

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_EMAIL = 'admin@fason.com';
const SEED_FLAG_KEY = 'seed.defaultAdmin.done';
const SETUP_COMPLETE_KEY = 'setup.complete';

function generateRandomPassword(): string {
  const words = ['amber', 'birch', 'coral', 'delta', 'ember', 'frost', 'grove',
    'haven', 'ivory', 'jade', 'kelp', 'lunar', 'maple', 'norse', 'onyx',
    'pine', 'quartz', 'river', 'sage', 'tide', 'umber', 'violet', 'willow',
    'xenon', 'yarrow', 'zephyr'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const w3 = words[Math.floor(Math.random() * words.length)];
  const num = crypto.randomInt(1000, 9999);
  return `${w1}-${w2}-${w3}-${num}`;
}

export const hashPasswordScrypt = hashPassword;
export const verifyPasswordScrypt = (password: string, hash: string) => verifyPassword({ password, hash });

export async function seedDefaultUser(): Promise<void> {
  const d = getDb();
  const setupComplete = (await d.select({ value: settings.value }).from(settings).where(eq(settings.key, SETUP_COMPLETE_KEY)).limit(1))[0];
  if (setupComplete?.value === '1') {
    return;
  }
  const seedFlag = (await d.select({ value: settings.value }).from(settings).where(eq(settings.key, SEED_FLAG_KEY)).limit(1))[0];
  if (seedFlag?.value === '1') {
    return;
  }
  const existing = (await d.select({ id: userTable.id }).from(userTable).where(eq(userTable.isDefault, 1)).limit(1))[0];
  if (existing) {
    await d.insert(settings).values({ key: SEED_FLAG_KEY, value: '1' })
            .onConflictDoUpdate({ target: settings.key, set: { value: '1' } });
    return;
  }
  if (process.env.ADMIN_PASSWORD?.trim()) {
    const password = process.env.ADMIN_PASSWORD.trim();
    const username = process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;
    try {
      const auth = await getAuth();
      const signUpRes: any = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: username,
          username,
        },
      } as any);
      const userId = signUpRes?.user?.id;
      if (!userId) {
        throw new Error('Better Auth signUpEmail did not return a user id');
      }
      await d.update(userTable).set({
                role: 'admin',
                isDefault: 1,
                permissions: JSON.stringify(ALL_PERMISSIONS),
                updatedAt: new Date(),
              }).where(eq(userTable.id, userId));
      await d.insert(settings).values({ key: SEED_FLAG_KEY, value: '1' })
                .onConflictDoUpdate({ target: settings.key, set: { value: '1' } });
      await d.insert(settings).values({ key: SETUP_COMPLETE_KEY, value: '1' })
                .onConflictDoUpdate({ target: settings.key, set: { value: '1' } });
      log.warn('Admin created from env, setup complete');
    } catch (err) {
      log.error(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }
}
