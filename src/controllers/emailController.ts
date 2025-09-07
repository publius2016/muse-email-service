import { Request, Response } from 'express';
import { emailService } from '@/services/emailService';
import { logger, logEmailOperation } from '@/utils/logger';
import { ContactFormData, NewsletterSignupData, NewsletterVerificationData } from '@/types';

export const emailController = {
  // Contact form welcome email
  async sendWelcomeEmail(req: Request, res: Response) {
    try {
      const contactData: ContactFormData = req.body;
      
      logger.info('Sending welcome email', {
        email: contactData.email,
        name: contactData.name,
        requestId: req.requestId
      });
      
      const result = await emailService.sendWelcomeEmail(contactData);
      
      if (result.success) {
        logEmailOperation('welcome_email', contactData, 'success');
        res.json({
          success: true,
          message: 'Welcome email sent successfully',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } else {
        logEmailOperation('welcome_email', contactData, 'error', new Error(result.error));
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send welcome email',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logEmailOperation('welcome_email', req.body, 'error', error as Error);
      throw error;
    }
  },

  // Admin notification email
  async sendAdminNotification(req: Request, res: Response) {
    try {
      const contactData: ContactFormData = req.body;
      
      logger.info('Sending admin notification', {
        email: contactData.email,
        name: contactData.name,
        requestId: req.requestId
      });
      
      const result = await emailService.sendAdminNotification(contactData);
      
      if (result.success) {
        logEmailOperation('admin_notification', contactData, 'success');
        res.json({
          success: true,
          message: 'Admin notification sent successfully',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } else {
        logEmailOperation('admin_notification', contactData, 'error', new Error(result.error));
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send admin notification',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logEmailOperation('admin_notification', req.body, 'error', error as Error);
      throw error;
    }
  },

  // Newsletter verification email
  async sendNewsletterVerificationEmail(req: Request, res: Response) {
    try {
      const signupData: NewsletterSignupData = req.body;
      
      logger.info('Sending newsletter verification email', {
        email: signupData.email,
        source: signupData.source,
        requestId: req.requestId
      });
      
      const result = await emailService.sendNewsletterVerificationEmail(signupData);
      
      if (result.success) {
        logEmailOperation('newsletter_verification', signupData, 'success');
        res.json({
          success: true,
          message: 'Verification email sent successfully',
          messageId: result.messageId,
          verificationUrl: result.verificationUrl,
          timestamp: new Date().toISOString()
        });
      } else {
        logEmailOperation('newsletter_verification', signupData, 'error', new Error(result.error));
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send verification email',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logEmailOperation('newsletter_verification', req.body, 'error', error as Error);
      throw error;
    }
  },

  // Newsletter welcome email
  async sendNewsletterWelcomeEmail(req: Request, res: Response) {
    try {
      const verificationData: NewsletterVerificationData = req.body;
      
      logger.info('Sending newsletter welcome email', {
        email: verificationData.email,
        requestId: req.requestId
      });
      
      const result = await emailService.sendNewsletterWelcomeEmail(verificationData);
      
      if (result.success) {
        logEmailOperation('newsletter_welcome', verificationData, 'success');
        res.json({
          success: true,
          message: 'Welcome email sent successfully',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } else {
        logEmailOperation('newsletter_welcome', verificationData, 'error', new Error(result.error));
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send welcome email',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logEmailOperation('newsletter_welcome', req.body, 'error', error as Error);
      throw error;
    }
  },
};
