/**
 * Express Application Configuration
 *
 * This file configures the Express application with all middleware,
 * routes, and error handlers. The server startup is handled separately
 * in server.ts to allow for better testing.
 *
 * @module app
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// Load environment variables first
dotenv.config();

// Middleware imports
import { helmetConfig, httpsRedirect, additionalSecurityHeaders } from './middleware/security';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler, createSuccessResponse } from './middleware/errorHandler';
import { logger } from './lib/logger';
import { swaggerSpec } from './swagger';

// Route imports
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import usersRoutes from './routes/users';
import agentsRoutes from './routes/agents';
import workflowsRoutes from './routes/workflows';
import projectsRoutes from './routes/projects'; // Epic 2: Project API
import templatesRoutes from './routes/templates';
import deploymentsRoutes from './routes/deployments';
import analyticsRoutes from './routes/analytics';
import executionsRoutes from './routes/executions';

/**
 * Create and configure Express application
 */
const app: Application = express();

// =============================================================================
// PRE-ROUTE MIDDLEWARE
// =============================================================================

// Trust proxy - required for accurate IP detection behind reverse proxies
// Set to true for most deployments (Railway, Render, Vercel, etc.)
app.set('trust proxy', 1);

// HTTPS redirect (production only)
app.use(httpsRedirect);

// Security headers (helmet)
app.use(helmetConfig);

// Additional security headers
app.use(additionalSecurityHeaders);

// Request ID generation/extraction
app.use(requestIdMiddleware);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Get allowed origins from environment
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000', // Development frontend
      'http://localhost:3001', // Development backend (for Swagger UI)
    ];

    // Add any additional origins from environment
    if (process.env.ADDITIONAL_CORS_ORIGINS) {
      const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',');
      allowedOrigins.push(...additionalOrigins);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// =============================================================================
// ROUTES
// =============================================================================

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';
const apiRouter = express.Router();

// Root API endpoint
apiRouter.get('/', (req: Request, res: Response) => {
  const requestId = req.requestId || 'unknown';
  res.json(
    createSuccessResponse(
      {
        name: 'Turbocat API',
        version: API_VERSION,
        documentation: `/api/${API_VERSION}/docs`,
      },
      requestId,
    ),
  );
});

// Authentication routes
apiRouter.use('/auth', authRoutes);

// OAuth authentication routes
apiRouter.use('/auth/oauth', oauthRoutes);

// User management routes
apiRouter.use('/users', usersRoutes);

// Agent management routes
apiRouter.use('/agents', agentsRoutes);

// Workflow management routes
apiRouter.use('/workflows', workflowsRoutes);

// Project management routes (Epic 2: wraps workflows with project-centric API)
apiRouter.use('/projects', projectsRoutes);

// Template management routes
apiRouter.use('/templates', templatesRoutes);

// Deployment management routes
apiRouter.use('/deployments', deploymentsRoutes);

// Analytics routes
apiRouter.use('/analytics', analyticsRoutes);

// Execution routes
apiRouter.use('/executions', executionsRoutes);

// =============================================================================
// API DOCUMENTATION
// =============================================================================

// Swagger UI options
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Turbocat API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

// Serve Swagger UI at /api/v1/docs
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Serve OpenAPI JSON specification at /api/v1/openapi.json
apiRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Mount API router
app.use(`/api/${API_VERSION}`, apiRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// =============================================================================
// EXPORTS
// =============================================================================

export default app;
