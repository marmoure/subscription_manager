import { OpenAPIHono } from '@hono/zod-openapi'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { exampleRouter } from './routes/example'
import subscriptionRouter from './routes/subscription'
import { 
  RegistrationSchema, 
  MachineQuerySchema, 
  LicenseKeyResponseSchema, 
  AdminUserListSchema 
} from './validators'

const app = new OpenAPIHono()

app.use('*', cors())
app.use('*', logger())

app.route('/', exampleRouter)
app.route('/api', subscriptionRouter)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Subscription Manager API',
  },
  components: {
    schemas: {
      Registration: RegistrationSchema,
      MachineQuery: MachineQuerySchema,
      LicenseKeyResponse: LicenseKeyResponseSchema,
      AdminUserList: AdminUserListSchema,
    },
  },
})

const port = parseInt(process.env.PORT || '3001')

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
