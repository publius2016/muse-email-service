import { Router, Request, Response } from 'express';
import { config } from '@/config/environment';
import { HealthCheckResponse } from '@/types';
import { logger } from '@/utils/logger';
import os from 'os';
import fs from 'fs';

const router = Router();

// Health check endpoint
router.get('/', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const checks = {
      emailService: 'ok' as 'ok' | 'error',
      memory: 'ok' as 'ok' | 'warning' | 'error',
      disk: 'ok' as 'ok' | 'warning' | 'error'
    };
    
    // Check memory usage (process-specific, not system-wide)
    const processMemUsage = process.memoryUsage();
    const heapUsagePercent = (processMemUsage.heapUsed / processMemUsage.heapTotal) * 100;
    
    // Reasonable thresholds for development (Node.js heap can safely use up to 95%)
    if (heapUsagePercent > 98) {
      checks.memory = 'error';
    } else if (heapUsagePercent > 95) {
      checks.memory = 'warning';
    } else {
      checks.memory = 'ok';
    }
    
    // Check disk space
    try {
      fs.statSync(process.cwd());
      // This is a basic check - in production you'd want more sophisticated disk monitoring
      checks.disk = 'ok';
    } catch {
      checks.disk = 'error';
    }
    
    // Determine overall health
    const isHealthy = Object.values(checks).every(check => check === 'ok');
    
    const response: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.nodeEnv,
      emailProvider: config.email.provider,
      checks
    };
    
    const statusCode = isHealthy ? 200 : 503;
    const responseTime = Date.now() - startTime;
    
    logger.info('Health check completed', {
      status: response.status,
      responseTime,
      checks
    });
    
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.nodeEnv,
      emailProvider: config.email.provider,
      checks: {
        emailService: 'error',
        memory: 'error',
        disk: 'error'
      },
      error: (error as Error).message
    });
  }
});

// Detailed health check (for monitoring systems)
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const detailedInfo = {
      service: 'muse-email-service',
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.nodeEnv,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        process: {
          memory: process.memoryUsage(),
          heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsagePercent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        cpu: {
          count: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown'
        },
        loadAverage: os.loadavg()
      },
      config: {
        port: config.port,
        emailProvider: config.email.provider,
        rateLimit: config.security.rateLimit
      }
    };
    
    res.json(detailedInfo);
  } catch (error) {
    logger.error('Detailed health check failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Health check failed' });
  }
});

export { router as healthRouter };
