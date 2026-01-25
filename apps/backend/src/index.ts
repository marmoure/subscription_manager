import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { config } from './config/env.js'        
import { validateApiKey } from './middleware/index.js'
import publicRoutes from './routes/public.routes.js'
import apiRoutes from './routes/api.routes.js'
import adminAuthRoutes from './routes/admin/auth.routes.js'
import adminLicenseRoutes from './routes/admin/licenses.routes.js'
import adminSubmissionRoutes from './routes/admin/submissions.routes.js'
import adminDashboardRoutes from './routes/admin/dashboard.routes.js'

export const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello World')
})

// Public routes
app.route('/api/public', publicRoutes)

// Admin routes
app.route('/api/admin', adminAuthRoutes)
app.route('/api/admin', adminLicenseRoutes)
app.route('/api/admin', adminSubmissionRoutes)
app.route('/api/admin', adminDashboardRoutes)

// Software API routes (RPC)
const routes = app.route('/api/v1', apiRoutes)

export type AppType = typeof routes

// Example of a route protected by API Key
app.get('/api/v1/software/verify', validateApiKey, (c) => {
  return c.json({
    success: true,
    message: 'API Key is valid',
    timestamp: new Date().toISOString()
  });
})

const port = config.PORT

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
