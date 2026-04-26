const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('./env');

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'verbaai API',
      version: '1.0.0',
      description:
        'Production-ready SaaS NLP API platform providing summarization, sentiment analysis, toxicity detection, and keyword extraction.',
      contact: {
        name: 'verbaai Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for NLP endpoint authentication',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for account management',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & API key management' },
      { name: 'AI', description: 'NLP processing endpoints' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec };
