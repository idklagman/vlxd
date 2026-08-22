import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from workspace root if not found in package directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://vlxd:vlxd_password@localhost:5432/vlxd',
  },
});
