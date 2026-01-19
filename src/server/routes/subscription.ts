import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { 
  RegistrationSchema, 
  MachineQuerySchema, 
  LicenseKeyResponseSchema, 
  AdminUserListSchema 
} from '../validators'

const app = new OpenAPIHono()

// Registration route
const registrationRoute = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegistrationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LicenseKeyResponseSchema,
        },
      },
      description: 'Registration successful',
    },
  },
})

// Machine query route
const machineQueryRoute = createRoute({
  method: 'get',
  path: '/machine/{machineId}',
  request: {
    params: MachineQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LicenseKeyResponseSchema,
        },
      },
      description: 'License key retrieved successfully',
    },
  },
})

// Admin user list route
const adminUserListRoute = createRoute({
  method: 'get',
  path: '/admin/users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AdminUserListSchema,
        },
      },
      description: 'User list retrieved successfully',
    },
  },
})

// Register the routes
app.openapi(registrationRoute, (c) => {
  const data = c.req.valid('json')
  // Mock implementation - in real app, this would save to database
  return c.json({
    licenseKey: `LICENSE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    machineId: `machine-${Date.now()}`,
    issueDate: new Date(),
    userName: data.name,
    shopName: data.shopName
  })
})

app.openapi(machineQueryRoute, (c) => {
  const { machineId } = c.req.valid('param')
  // Mock implementation
  return c.json({
    licenseKey: 'LICENSE-123-ABC',
    machineId: machineId,
    issueDate: new Date(),
    userName: 'John Doe',
    shopName: 'My Shop'
  })
})

app.openapi(adminUserListRoute, (c) => {
  // Mock implementation
  return c.json({
    users: [
      {
        id: 1,
        userName: 'John Doe',
        phoneNumber: '+1234567890',
        shopName: 'My Shop',
        address: '123 Main St, City, State',
        numberOfCashiers: 2,
        machineId: 'machine-123',
        licenseKey: 'LICENSE-123-ABC',
        issueDate: new Date()
      }
    ],
    total: 1,
    page: 1,
    limit: 10
  })
})

export default app