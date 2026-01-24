import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set, defaulting to sqlite.db');
}

const client = new Database(process.env.DATABASE_URL || 'sqlite.db');

export const db = drizzle(client, { 
  schema, 
  logger: process.env.NODE_ENV === 'development' 
});
