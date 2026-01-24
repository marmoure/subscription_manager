import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const licenseKeys = sqliteTable('license_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  licenseKey: text('license_key').unique().notNull(),
  machineId: text('machine_id').notNull(),
  status: text('status', { enum: ['active', 'inactive', 'revoked'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date()).$onUpdate(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
}, (table) => ({
  licenseKeyIdx: uniqueIndex('license_key_idx').on(table.licenseKey),
  machineIdIdx: index('machine_id_idx').on(table.machineId),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type LicenseKey = InferSelectModel<typeof licenseKeys>;
export type NewLicenseKey = InferInsertModel<typeof licenseKeys>;
