import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  API_VERSION: Joi.string().default('v1'),
  
  // Email Provider
  EMAIL_PROVIDER: Joi.string().valid('mailgun', 'smtp', 'ethereal').default('mailgun'),
  USE_REAL_EMAIL_IN_DEV: Joi.boolean().default(false),
  
  // Mailgun
  MAILGUN_USER: Joi.string().when('EMAIL_PROVIDER', { is: 'mailgun', then: Joi.required() }),
  MAILGUN_PASSWORD: Joi.string().when('EMAIL_PROVIDER', { is: 'mailgun', then: Joi.required() }),
  MAILGUN_DOMAIN: Joi.string().when('EMAIL_PROVIDER', { is: 'mailgun', then: Joi.required() }),
  
  // SMTP
  SMTP_HOST: Joi.string().when('EMAIL_PROVIDER', { is: 'smtp', then: Joi.required() }),
  SMTP_PORT: Joi.number().when('EMAIL_PROVIDER', { is: 'smtp', then: Joi.required() }),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().when('EMAIL_PROVIDER', { is: 'smtp', then: Joi.required() }),
  SMTP_PASS: Joi.string().when('EMAIL_PROVIDER', { is: 'smtp', then: Joi.required() }),
  
  // Email Settings
  FROM_EMAIL: Joi.string().email().required(),
  FROM_NAME: Joi.string().default('The Code Muse'),
  ADMIN_EMAIL: Joi.string().email().required(),
  
  // URLs
  FRONTEND_URL: Joi.string().uri().required(),
  ADMIN_URL: Joi.string().uri().required(),
  
  // Security
  API_KEY: Joi.string().min(32).required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/email-service.log'),
  
  // Health Check
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000)
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Configuration object
export const config = {
  // Server
  port: envVars.PORT,
  nodeEnv: envVars.NODE_ENV,
  apiVersion: envVars.API_VERSION,
  
  // Email
  email: {
    provider: envVars.EMAIL_PROVIDER,
    useRealEmailInDev: envVars.USE_REAL_EMAIL_IN_DEV,
    
    // Mailgun config
    mailgun: {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: envVars.MAILGUN_USER,
        pass: envVars.MAILGUN_PASSWORD
      }
    },
    
    // SMTP config
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: envVars.SMTP_SECURE,
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS
    },
    
    // Ethereal (development) - will be created dynamically
    ethereal: {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test@ethereal.email'
      }
    },
    
    // Email settings
    fromEmail: envVars.FROM_EMAIL,
    fromName: envVars.FROM_NAME,
    adminEmail: envVars.ADMIN_EMAIL
  },
  
  // URLs
  urls: {
    frontend: envVars.FRONTEND_URL,
    admin: envVars.ADMIN_URL
  },
  
  // Security
  security: {
    apiKey: envVars.API_KEY,
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS
    }
  },
  
  // Logging
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE
  },
  
  // Health Check
  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
    timeout: envVars.HEALTH_CHECK_TIMEOUT
  },
  
  // CORS origins
  allowedOrigins: [
    envVars.FRONTEND_URL,
    envVars.ADMIN_URL,
    'http://localhost:3000',
    'http://localhost:1337'
  ]
};
