import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { db } from '../db'
import { licenses } from '../db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

const RequestBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required').regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  shopName: z.string().min(1, 'Shop name is required').max(200, 'Shop name must be less than 200 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  numberOfCashiers: z.number().int().min(1, 'Number of cashiers must be at least 1').max(100, 'Number of cashiers must be less than 100')
})

const RegisterResponseSchema = z.object({
  licenseKey: z.string()
})

const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RequestBodySchema as any
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: RegisterResponseSchema as any
        }
      },
      description: 'Registration successful - returns generated license key'
    },
    400: {
      description: 'Invalid input data'
    },
    409: {
      description: 'Machine ID already registered'
    }
  }
})

export const registerRouter = new OpenAPIHono()

registerRouter.openapi(registerRoute, async (c) => {
  try {
    const registrationData = c.req.valid('json') as any
    
    // Generate machine ID based on user data and timestamp
    const machineId = `${registrationData.shopName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`
    
    // Check if machine ID already exists
    const existingLicense = await db.select()
      .from(licenses)
      .where(eq(licenses.machineId, machineId))
      .limit(1)
    
    if (existingLicense.length > 0) {
      return c.json({ error: 'Machine ID already registered' }, 409)
    }
    
    // Generate a simple license key using crypto
    const licenseKey = `LICENSE-${machineId}-${randomBytes(8).toString('hex').toUpperCase()}`
    
    // Insert new license record
    const newLicense = await db.insert(licenses).values({
      userName: registrationData.name,
      phoneNumber: registrationData.phoneNumber,
      shopName: registrationData.shopName,
      address: registrationData.address,
      numberOfCashiers: registrationData.numberOfCashiers,
      machineId: machineId,
      licenseKey: licenseKey,
      issueDate: new Date()
    }).returning()
    
    return c.json({ licenseKey: licenseKey })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})