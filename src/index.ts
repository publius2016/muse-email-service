import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from '@/config/environment';
import { logger, addRequestId } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { apiKeyAuth } from '@/middleware/apiKeyAuth';
import { healthRouter } from '@/routes/health';
import { emailRouter } from '@/routes/email';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Request ID middleware (must be early in the middleware chain)
app.use(addRequestId);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Enhanced HTTP request logging with request ID
app.use(morgan((tokens: any, req: any, res: any) => {
  const requestId = req.requestId || 'unknown';
  const method = tokens['method']?.(req, res);
  const url = tokens['url']?.(req, res);
  const status = tokens['status']?.(req, res);
  const responseTime = tokens['response-time']?.(req, res);
  const contentLength = tokens['res']?.(req, res, 'content-length');
  const remoteAddr = tokens['remote-addr']?.(req, res);
  const userAgent = tokens['user-agent']?.(req, res);
  
  const logData = {
    method: method || 'unknown',
    url: url || 'unknown',
    status: status || 'unknown',
    responseTime: responseTime ? `${responseTime}ms` : 'unknown',
    contentLength: contentLength || 'unknown',
    remoteAddr: remoteAddr || 'unknown',
    userAgent: userAgent || 'unknown',
    requestId
  };
  
  const statusCode = parseInt(status || '0', 10);
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, 'HTTP request', logData);
  return '';
}, {
  immediate: false,
  skip: (req: any) => req['url'] === '/health' && config.nodeEnv === 'production' // Skip health checks in production
}));

// Health check (no auth required)
app.use('/health', healthRouter);

// API routes (auth required)
app.use('/api/v1', apiKeyAuth, emailRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Email Service running on port ${PORT}`);
  logger.info(`📧 Environment: ${config.nodeEnv}`);
  logger.info(`🔧 Email Provider: ${config.email.provider}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
