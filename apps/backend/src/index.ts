import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { config } from './config/env.js'        
import { validateApiKey } from './middleware/index.js'
import publicRoutes from './routes/public.routes.js'

export const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello World')
})

// Public routes
app.route('/api/public', publicRoutes)

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
