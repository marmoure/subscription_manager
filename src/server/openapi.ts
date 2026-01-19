import { OpenAPIHono } from '@hono/zod-openapi'

export const openAPISpecs = {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Subscription Manager API',
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
