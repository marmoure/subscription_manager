import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { db } from '../db'
import { licenses } from '../db/schema'
import { eq } from 'drizzle-orm'

const ParamsSchema = z.object({
  machineId: z.string().openapi({
    param: {
      name: 'machineId',
      in: 'path',
    },
    example: 'machine-123',
  }),
})

const LicenseResponseSchema = z.object({
  license_key: z.string().openapi({
    example: 'LICENSE-ABC-123',
  }),
})

const getLicenseRoute = createRoute({
  method: 'get',
  path: '/license/{machineId}',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LicenseResponseSchema,
        },
      },
      description: 'License found',
    },
    404: {
      description: 'License not found',
    },
  },
})

export const licenseRouter = new OpenAPIHono()

licenseRouter.openapi(getLicenseRoute, async (c) => {
  const { machineId } = c.req.valid('param')
  
  const result = await db
    .select({ licenseKey: licenses.licenseKey })
    .from(licenses)
    .where(eq(licenses.machineId, machineId))
    .limit(1)

  if (result.length === 0) {
    return c.json({ error: 'License not found' }, 404)
  }

  return c.json({ license_key: result[0].licenseKey })
})