import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';


const connectionString = process.env.DATABASE_URL || 'postgresql://vlxd:vlxd_password@localhost:5432/vlxd';


// For queries
const queryClient = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(queryClient, { schema });

// Export for migration usage
export const migrationClient = postgres(connectionString, { max: 1 });

export type Database = typeof db;
