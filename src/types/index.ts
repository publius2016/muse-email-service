// Email Provider Types
export type EmailProvider = 'mailgun' | 'smtp' | 'ethereal';

// Email Template Types
export interface EmailTemplate {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

// Email Service Response
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  verificationUrl?: string;
}

// Contact Form Data
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  documentId?: string;
  createdAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Newsletter Signup Data
export interface NewsletterSignupData {
  email: string;
  firstName?: string;
  lastName?: string;
  verificationToken: string;
  source: string;
  sourceUrl?: string;
}

// Newsletter Verification Data
export interface NewsletterVerificationData {
  email: string;
  firstName?: string;
  lastName?: string;
}

// Email Service Methods
export interface EmailService {
  sendWelcomeEmail(data: ContactFormData): Promise<EmailResponse>;
  sendAdminNotification(data: ContactFormData): Promise<EmailResponse>;
  sendNewsletterVerificationEmail(data: NewsletterSignupData): Promise<EmailResponse>;
  sendNewsletterWelcomeEmail(data: NewsletterVerificationData): Promise<EmailResponse>;
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  emailProvider: string;
  checks: {
    emailService: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'error';
    disk: 'ok' | 'warning' | 'error';
  };
}

// Error Types
export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
