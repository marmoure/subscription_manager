import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  interval: text('interval').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const licenses = sqliteTable('licenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userName: text('user_name'),
  phoneNumber: text('phone_number'),
  shopName: text('shop_name'),
  address: text('address'),
  numberOfCashiers: integer('number_of_cashiers'),
  machineId: text('machine_id').notNull().unique(),
  licenseKey: text('license_key').unique(),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  machineIdIdx: index('machine_id_idx').on(table.machineId),
}))
