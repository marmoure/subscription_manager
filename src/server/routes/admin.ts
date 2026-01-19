import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { db } from '../db'
import { licenses } from '../db/schema'

const LicenseSchema = z.object({
  id: z.number().openapi({
    example: 1,
  }),
  userName: z.string().nullable().openapi({
    example: 'John Doe',
  }),
  phoneNumber: z.string().nullable().openapi({
    example: '+1234567890',
  }),
  shopName: z.string().nullable().openapi({
    example: 'Corner Store',
  }),
  address: z.string().nullable().openapi({
    example: '123 Main St, City, State',
  }),
  numberOfCashiers: z.number().nullable().openapi({
    example: 5,
  }),
  machineId: z.string().openapi({
    example: 'machine-12345',
  }),
  licenseKey: z.string().nullable().openapi({
    example: 'license-key-abc123',
  }),
  issueDate: z.string().openapi({
    example: '2023-01-15T10:30:00.000Z',
  }),
})

const GetLicensesRoute = createRoute({
  method: 'get',
  path: '/admin/licenses',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(LicenseSchema),
        },
      },
      description: 'List of all licenses',
    },
  },
})

export const adminRouter = new OpenAPIHono()

adminRouter.openapi(GetLicensesRoute, async (c) => {
  const allLicenses = await db.select().from(licenses)
  
const formattedLicenses = allLicenses.map(license => ({
    id: license.id,
    userName: license.userName,
    phoneNumber: license.phoneNumber,
    shopName: license.shopName,
    address: license.address,
    numberOfCashiers: license.numberOfCashiers,
    machineId: license.machineId,
    licenseKey: license.licenseKey,
    issueDate: license.issueDate.toISOString(),
  }))
  
  return c.json(formattedLicenses)
})