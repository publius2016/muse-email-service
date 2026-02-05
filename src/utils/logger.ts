import winston from 'winston';
import { config } from '@/config/environment';
import path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define structured JSON log format
const jsonLogFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format (human-readable in development, JSON in production)
const consoleFormat = config.nodeEnv === 'production'
  ? jsonLogFormat
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const requestIdStr = requestId ? `[${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${requestIdStr} [${level}]: ${message}${metaStr}`;
      })
    );

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: jsonLogFormat,
  defaultMeta: {
    service: 'muse-email-service',
    version: process.env['npm_package_version'] || '1.0.0',
    environment: config.nodeEnv
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // File transport for errors (JSON format)
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs (JSON format)
    new winston.transports.File({
      filename: config.logging.file,
      format: jsonLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: jsonLogFormat
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: jsonLogFormat
    })
  ]
});

/**
 * Create a child logger with request ID context
 * This ensures all logs for a request include the request ID
 */
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

/**
 * Middleware to add request ID to all requests
 * Generates UUID v4 for better uniqueness and traceability
 */
export const addRequestId = (req: Request, res: any, next: any) => {
  // Use existing request ID from header if present, otherwise generate new one
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Log email operations with structured data
 */
export const logEmailOperation = (
  operation: string,
  data: any,
  result: 'success' | 'error',
  error?: Error,
  requestId?: string
) => {
  const logData: any = {
    operation,
    result,
    ...(data.email && { email: data.email }),
    ...(requestId && { requestId }),
    ...(error && { 
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    })
  };
  
  if (result === 'success') {
    logger.info('Email operation completed', logData);
  } else {
    logger.error('Email operation failed', logData);
  }
};

export default logger;
