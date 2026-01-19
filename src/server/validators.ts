import { z } from 'zod'

export const RegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required').regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  shopName: z.string().min(1, 'Shop name is required').max(200, 'Shop name must be less than 200 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  numberOfCashiers: z.number().int().min(1, 'Number of cashiers must be at least 1').max(100, 'Number of cashiers must be less than 100')
}).openapi('Registration')

export const MachineQuerySchema = z.object({
  machineId: z.string().min(1, 'Machine ID is required')
}).openapi('MachineQuery')

export const LicenseKeyResponseSchema = z.object({
  licenseKey: z.string().nullable(),
  machineId: z.string(),
  issueDate: z.date(),
  userName: z.string().nullable(),
  shopName: z.string().nullable()
}).openapi('LicenseKeyResponse')

export const AdminUserListSchema = z.object({
  users: z.array(z.object({
    id: z.number(),
    userName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    shopName: z.string().nullable(),
    address: z.string().nullable(),
    numberOfCashiers: z.number().nullable(),
    machineId: z.string(),
    licenseKey: z.string().nullable(),
    issueDate: z.date()
  })),
  total: z.number(),
  page: z.number(),
  limit: z.number()
}).openapi('AdminUserList')

export type RegistrationType = z.infer<typeof RegistrationSchema>
export type MachineQueryType = z.infer<typeof MachineQuerySchema>
export type LicenseKeyResponseType = z.infer<typeof LicenseKeyResponseSchema>
export type AdminUserListType = z.infer<typeof AdminUserListSchema>