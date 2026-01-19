import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const ParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '123',
  }),
})

const ItemSchema = z.object({
  id: z.string().openapi({
    example: '123',
  }),
  name: z.string().openapi({
    example: 'Example Item',
  }),
})

const exampleRoute = createRoute({
  method: 'get',
  path: '/items/{id}',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ItemSchema,
        },
      },
      description: 'Get item by id',
    },
  },
})

export const exampleRouter = new OpenAPIHono()

exampleRouter.openapi(exampleRoute, (c) => {
  const { id } = c.req.valid('param')
  return c.json({
    id,
    name: 'Example Item',
  })
})
