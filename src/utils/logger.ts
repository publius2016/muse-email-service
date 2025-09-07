import winston from 'winston';
import { config } from '@/config/environment';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'muse-email-service',
    version: process.env['npm_package_version'] || '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Add request ID to logs
export const addRequestId = (req: any, res: any, next: any) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Log email operations
export const logEmailOperation = (
  operation: string,
  data: any,
  result: 'success' | 'error',
  error?: Error
) => {
  const logData = {
    operation,
    email: data.email,
    result,
    timestamp: new Date().toISOString(),
    ...(error && { error: error.message, stack: error.stack })
  };
  
  if (result === 'success') {
    logger.info('Email operation completed', logData);
  } else {
    logger.error('Email operation failed', logData);
  }
};

export default logger;
