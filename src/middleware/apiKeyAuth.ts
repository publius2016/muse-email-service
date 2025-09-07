import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';
import { AuthenticationError } from '@/types';
import { logger } from '@/utils/logger';

export const apiKeyAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      logger.warn('API request without API key', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      throw new AuthenticationError('API key is required');
    }
    
    if (apiKey !== config.security.apiKey) {
      logger.warn('Invalid API key provided', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
        providedKey: apiKey.substring(0, 8) + '...' // Log partial key for debugging
      });
      throw new AuthenticationError('Invalid API key');
    }
    
    // Log successful authentication
    logger.debug('API request authenticated', {
      ip: req.ip,
      url: req.url,
      requestId: req.requestId
    });
    
    next();
  } catch (error) {
    next(error);
  }
};
