import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config/env.js'        
import { validateApiKey } from './middleware/index.js'
import publicRoutes from './routes/public.routes.js'
import apiRoutes from './routes/api.routes.js'
import adminAuthRoutes from './routes/admin/auth.routes.js'
import adminLicenseRoutes from './routes/admin/licenses.routes.js'
import adminSubmissionRoutes from './routes/admin/submissions.routes.js'
import adminDashboardRoutes from './routes/admin/dashboard.routes.js'
import adminApiKeyRoutes from './routes/admin/apikeys.routes.js'

export const app = new Hono()

app.use('/api/*', cors())

app.get('/', (c) => {
  return c.text('Hello World')
})

const routes = app
  .route('/api/public', publicRoutes)
  .route('/api/admin', adminAuthRoutes)
  .route('/api/admin', adminLicenseRoutes)
  .route('/api/admin', adminSubmissionRoutes)
  .route('/api/admin', adminDashboardRoutes)
  .route('/api/admin', adminApiKeyRoutes)
  .route('/api/v1', apiRoutes)

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

if (process.env.NODE_ENV !== 'test') {
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port
  })
}