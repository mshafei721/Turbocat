/**
 * Security Middleware Configuration
 *
 * Configures helmet and other security-related middleware for the Express app.
 * Implements OWASP security guidelines.
 *
 * @module middleware/security
 */

import helmet from 'helmet';
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Helmet configuration with security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for API docs
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // Required for Swagger UI if used
      workerSrc: ["'self'", 'blob:'],
    },
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for API compatibility

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frameguard - prevent clickjacking
  frameguard: { action: 'deny' },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open - prevent IE from executing downloads in site context
  ieNoOpen: true,

  // No Sniff - prevent MIME type sniffing
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter (deprecated in modern browsers but kept for legacy support)
  xssFilter: true,
});

/**
 * HTTPS redirect middleware for production
 * Redirects HTTP requests to HTTPS
 */
export const httpsRedirect: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Check for various proxy headers that indicate HTTPS
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-ssl'] === 'on';

  if (!isHttps) {
    // Redirect to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    res.redirect(301, httpsUrl);
    return;
  }

  next();
};

/**
 * Additional security headers not covered by helmet
 */
export const additionalSecurityHeaders: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  );

  next();
};

/**
 * Request sanitization middleware
 * Sanitizes common injection patterns from request data
 *
 * Note: This is a basic sanitization. For comprehensive protection,
 * use input validation with Zod schemas on each route.
 */
export const sanitizeRequest: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize body (if parsed)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      return sanitizeString(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized as T;
}

/**
 * Sanitize a string value
 * Removes common XSS patterns and trims whitespace
 */
function sanitizeString(str: string): string {
  return (
    str
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Encode HTML entities for potential XSS vectors
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  );
}

export default helmetConfig;
