import fs from 'fs';

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// replace imports
schema = schema.replace(/import \{ pgTable, text, integer, blob, uniqueIndex \} from 'drizzle-orm\/pg-core';/, 
  "import { pgTable, text, integer, boolean, timestamp, serial, customType, uniqueIndex } from 'drizzle-orm/pg-core';\n" +
  "const bytea = customType<{ data: Buffer; driverData: string }>({ dataType() { return 'bytea'; } });");

// replace integer(..., { mode: 'boolean' }) with boolean(...)
schema = schema.replace(/integer\('([^']+)',\s*\{\s*mode:\s*'boolean'\s*\}\)/g, "boolean('$1')");

// replace integer(..., { mode: 'timestamp' }) with timestamp(...)
schema = schema.replace(/integer\('([^']+)',\s*\{\s*mode:\s*'timestamp'\s*\}\)/g, "timestamp('$1', { mode: 'date' })");

// replace primaryKey({ autoIncrement: true }) on integer with serial
schema = schema.replace(/integer\('([^']+)'\)\.primaryKey\(\{\s*autoIncrement:\s*true\s*\}\)/g, "serial('$1').primaryKey()");

// replace blob(...) with bytea(...)
schema = schema.replace(/blob\(/g, "bytea(");

fs.writeFileSync('src/db/schema.ts', schema);
