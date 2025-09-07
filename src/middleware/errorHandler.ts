import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { EmailServiceError, ValidationError, AuthenticationError } from '@/types';
import { config } from '@/config/environment';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Unhandled error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId
  });

  // Handle specific error types
  if (error instanceof EmailServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: error.message,
      field: error.field,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    res.status(401).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle Joi validation errors
  if (error.name === 'ValidationError' && 'details' in error) {
    const details = (error as any).details;
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv !== 'production' && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
