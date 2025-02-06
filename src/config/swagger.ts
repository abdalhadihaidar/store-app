import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';  // Default to localhost if not set

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Store API',
      version: '1.0.0',
      description: 'API documentation for the store system',
    },
    servers: [{ url: `${SERVER_URL}/api` }],
  },
  apis: ['./src/routes/*.ts'], // Path to API docs
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};


const swaggerSpec = swaggerJsdoc(options);

