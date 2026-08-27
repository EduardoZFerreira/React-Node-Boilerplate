import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'React-Node Boilerplate API',
      version: '1.0.0',
      description:
        'REST API with session-based authentication and role-based access control.\n\n' +
        'Authentication uses **httpOnly session cookies** — no token is exposed to JavaScript.\n\n' +
        'Login via `POST /login`, then all subsequent requests include the session cookie automatically.',
    },
    servers: [{ url: `http://localhost:${process.env.API_PORT ?? 8081}` }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sid',
          description: 'httpOnly session cookie — set automatically after login',
        },
        apiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for programmatic access (alternative: Authorization: ApiKey <key>)',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            hasError: { type: 'boolean', example: true },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    path.resolve(__dirname, '../routes/publicRoutes.ts'),
    path.resolve(__dirname, '../routes/privateRoutes.ts'),
    path.resolve(__dirname, '../routes/itemRoutes.ts'),
    path.resolve(__dirname, '../routes/apiKeyRoutes.ts'),
    path.resolve(__dirname, '../routes/adminRoutes.ts'),
    path.resolve(__dirname, '../routes/tenantRoutes.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
