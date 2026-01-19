import { OpenAPIHono } from '@hono/zod-openapi'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { exampleRouter } from './routes/example'
import { openAPISpecs } from './openapi'

const app = new OpenAPIHono()

app.use('*', cors())
app.use('*', logger())

app.route('/', exampleRouter)
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Subscription Manager API',
  },
})

app.get('/openapi', (c) => {
  return c.json(openAPISpecs)
})

const port = parseInt(process.env.PORT || '3000')

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
