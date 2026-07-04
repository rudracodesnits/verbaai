const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { swaggerSpec } = require('./config/swagger');
const { env } = require('./config/env');

/**
 * Create and configure the Express application.
 * Separated from server.js for testability.
 */
function createApp() {
  const app = express();

  // ─── Security ────────────────────────────────────
  app.use(helmet());
  app.use(cors());

  // ─── Body Parsing ────────────────────────────────
  app.use(express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.endsWith('/stripe-webhook')) {
        req.rawBody = buf;
      }
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request Logging ─────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('short'));
  }

  // ─── Swagger Documentation ───────────────────────
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'verbaai API — Documentation',
    })
  );

  // Serve raw OpenAPI spec
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ─── Health Check ────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'verbaai API',
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ──────────────────────────────────
  app.use('/', routes);

  // ─── 404 Handler ─────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ─── Error Handler ───────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
