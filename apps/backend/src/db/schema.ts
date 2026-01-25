import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, type InferSelectModel, type InferInsertModel, relations } from 'drizzle-orm';

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

export const userSubmissions = sqliteTable('user_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  machineId: text('machine_id').notNull(),
  phone: text('phone').notNull(),
  shopName: text('shop_name').notNull(),
  email: text('email').notNull(),
  numberOfCashiers: integer('number_of_cashiers').notNull(),
  submissionDate: integer('submission_date', { mode: 'timestamp' }).notNull().default(new Date()),
  ipAddress: text('ip_address'),
  licenseKeyId: integer('license_key_id').references(() => licenseKeys.id),
}, (table) => ({
  nameIdx: index('submission_name_idx').on(table.name),
  emailIdx: index('submission_email_idx').on(table.email),
  shopNameIdx: index('submission_shop_name_idx').on(table.shopName),
  machineIdIdx: index('submission_machine_id_idx').on(table.machineId),
  submissionDateIdx: index('submission_date_idx').on(table.submissionDate),
  cashiersIdx: index('submission_cashiers_idx').on(table.numberOfCashiers),
}));

export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
}, (table) => ({
  keyIdx: index('key_idx').on(table.key),
}));

export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  hashedPassword: text('hashed_password').notNull(),
  email: text('email').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const verificationLogs = sqliteTable('verification_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  licenseKeyId: integer('license_key_id').notNull().references(() => licenseKeys.id),
  machineId: text('machine_id').notNull(),
  status: text('status', { enum: ['success', 'failed'] }).notNull(),
  message: text('message'),
  ipAddress: text('ip_address'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(new Date()),
}, (table) => ({
  licenseKeyIdIdx: index('verification_logs_license_key_id_idx').on(table.licenseKeyId),
  machineIdIdx: index('verification_logs_machine_id_idx').on(table.machineId),
  timestampIdx: index('verification_logs_timestamp_idx').on(table.timestamp),
}));

export const licenseKeysRelations = relations(licenseKeys, ({ one, many }) => ({
  submission: one(userSubmissions),
  verificationLogs: many(verificationLogs),
}));

export const verificationLogsRelations = relations(verificationLogs, ({ one }) => ({
  licenseKey: one(licenseKeys, {
    fields: [verificationLogs.licenseKeyId],
    references: [licenseKeys.id],
  }),
}));

export const userSubmissionsRelations = relations(userSubmissions, ({ one }) => ({
  licenseKey: one(licenseKeys, {
    fields: [userSubmissions.licenseKeyId],
    references: [licenseKeys.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type LicenseKey = InferSelectModel<typeof licenseKeys>;
export type NewLicenseKey = InferInsertModel<typeof licenseKeys>;

export type UserSubmission = InferSelectModel<typeof userSubmissions>;
export type NewUserSubmission = InferInsertModel<typeof userSubmissions>;

export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;

export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;

export type VerificationLog = InferSelectModel<typeof verificationLogs>;
export type NewVerificationLog = InferInsertModel<typeof verificationLogs>;
