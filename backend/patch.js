import fs from 'fs';

const log = `
src/db/index.ts(71,68): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<string>'?
src/db/index.ts(85,74): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(93,132): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(100,61): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ id: number; originalName: string; mimeType: string | null; fileSize: number | null; createdAt: string | null; fileType: string; }[]>'?
src/db/index.ts(117,84): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(135,33): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<number>'?
src/db/index.ts(142,101): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(152,62): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(158,50): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<number>'?
src/db/index.ts(165,33): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<string>'?
src/db/index.ts(183,55): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ permissions: string; id: string; email: string; name: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string; banned: boolean | null; ... 5 more ...; deviceSecret: string | null; } | undefined>'?
src/db/index.ts(194,34): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ permissions: string; id: string; email: string; name: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string; banned: boolean | null; ... 5 more ...; deviceSecret: string | null; } | undefined>'?
src/db/index.ts(199,24): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ permissions: string; id: string; email: string; name: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string; banned: boolean | null; ... 5 more ...; deviceSecret: string | null; }[]>'?
src/db/index.ts(221,163): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(229,67): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(248,26): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<number>'?
src/db/index.ts(254,41): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<Permission[]>'?
src/db/index.ts(261,42): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ id: string; createdAt: Date; updatedAt: Date; userId: string; expiresAt: Date; token: string; ipAddress: string | null; userAgent: string | null; impersonatedBy: string | null; }[]>'?
src/db/index.ts(269,43): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ id: string; createdAt: Date; updatedAt: Date; userId: string; expiresAt: Date; token: string; ipAddress: string | null; userAgent: string | null; impersonatedBy: string | null; } | null>'?
src/db/index.ts(281,47): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(287,65): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<number>'?
src/db/index.ts(294,87): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(298,106): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<void>'?
src/db/index.ts(308,72): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ id: string; status: string; } | undefined>'?
src/db/index.ts(317,95): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<string[]>'?
src/db/index.ts(337,68): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(348,67): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<number>'?
src/db/index.ts(355,58): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(361,43): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
src/db/index.ts(367,45): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<string | null>'?
src/db/index.ts(373,54): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<string>'?
src/db/index.ts(386,32): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{ userId: string; deviceSecret: string; }[]>'?
`;

const lines = fs.readFileSync('src/db/index.ts', 'utf8').split('\n');

for (const match of log.matchAll(/src\/db\/index\.ts\((\d+),\d+\):.*?write '(Promise<.*?>)'\?/g)) {
    const lineNum = parseInt(match[1]) - 1;
    const expectedType = match[2];
    
    // We just find the colon and the return type and replace it.
    // E.g. `): string {` -> `): Promise<string> {`
    // Or if there's no return type defined, we might need to add it, but TS implies it has one.
    lines[lineNum] = lines[lineNum].replace(/:\s*(?!Promise<)(.+?)\s*\{/, `: ${expectedType} {`);
}

// Fix .limit(1).limit(1) on line 314
lines[313] = lines[313].replace('.limit(1).limit(1)', '.limit(1)');

fs.writeFileSync('src/db/index.ts', lines.join('\n'));
