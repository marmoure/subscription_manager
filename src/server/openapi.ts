import { OpenAPIHono } from '@hono/zod-openapi'
import { 
  RegistrationSchema, 
  MachineQuerySchema, 
  LicenseKeyResponseSchema, 
  AdminUserListSchema 
} from './validators'

export const openAPISpecs = {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Subscription Manager API',
  },
  components: {
    schemas: {
      Registration: RegistrationSchema.openapi('Registration', {
        example: {
          name: 'John Doe',
          phoneNumber: '+1234567890',
          shopName: 'My Shop',
          address: '123 Main St, City, State',
          numberOfCashiers: 2
        }
      }),
      MachineQuery: MachineQuerySchema.openapi('MachineQuery', {
        example: {
          machineId: 'machine-123'
        }
      }),
      LicenseKeyResponse: LicenseKeyResponseSchema.openapi('LicenseKeyResponse', {
        example: {
          licenseKey: 'LICENSE-123-ABC',
          machineId: 'machine-123',
          issueDate: '2024-01-15T00:00:00.000Z',
          userName: 'John Doe',
          shopName: 'My Shop'
        }
      }),
      AdminUserList: AdminUserListSchema.openapi('AdminUserList', {
        example: {
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
              issueDate: '2024-01-15T00:00:00.000Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        }
      })
    }
  },
  paths: {
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Get item by id',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
