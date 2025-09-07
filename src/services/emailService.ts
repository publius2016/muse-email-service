import nodemailer from 'nodemailer';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { 
  EmailService, 
  EmailResponse, 
  ContactFormData, 
  NewsletterSignupData, 
  NewsletterVerificationData,
  EmailServiceError 
} from '@/types';

class EmailServiceImpl implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    // Use configured provider
    switch (config.email.provider) {
      case 'mailgun':
        logger.info('Using Mailgun email provider');
        return nodemailer.createTransport(config.email.mailgun);
      
      case 'smtp':
        logger.info('Using SMTP email provider');
        return nodemailer.createTransport(config.email.smtp);
      
      case 'ethereal':
        logger.info('Using Ethereal email provider');
        return nodemailer.createTransport(config.email.ethereal);
      
      default:
        throw new EmailServiceError(
          `Unsupported email provider: ${config.email.provider}`,
          'UNSUPPORTED_PROVIDER'
        );
    }
  }

  async sendWelcomeEmail(contactData: ContactFormData): Promise<EmailResponse> {
    try {
      const { name, email, subject, message } = contactData;
      
      const emailTemplate = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: email,
        subject: 'Thank you for contacting The Code Muse!',
        headers: {
          'List-Unsubscribe': `<mailto:unsubscribe@thecodemuse.com?subject=unsubscribe>`,
          'X-Mailer': 'The Code Muse Contact Form',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        },
        html: this.generateWelcomeEmailHTML(name, subject, message),
        text: this.generateWelcomeEmailText(name, subject, message)
      };

      const info = await this.transporter.sendMail(emailTemplate);
      
      // For development, show the preview URL
      if (config.nodeEnv === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info('📧 Email Preview URL:', previewUrl);
        }
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendAdminNotification(contactData: ContactFormData): Promise<EmailResponse> {
    try {
      const { name, email, subject, message, documentId, createdAt, ipAddress, userAgent } = contactData;
      
      const emailTemplate = {
        from: `"The Code Muse Contact Form" <${config.email.fromEmail}>`,
        to: config.email.adminEmail,
        subject: `New Contact Form Submission: ${subject}`,
        headers: {
          'X-Mailer': 'The Code Muse Contact Form',
          'X-Priority': '1',
          'X-MSMail-Priority': 'High'
        },
        html: this.generateAdminNotificationHTML(name, email, subject, message, documentId, createdAt, ipAddress, userAgent),
        text: this.generateAdminNotificationText(name, email, subject, message, documentId, createdAt, ipAddress, userAgent)
      };

      const info = await this.transporter.sendMail(emailTemplate);
      
      // For development, show the preview URL
      if (config.nodeEnv === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info('📧 Admin Email Preview URL:', previewUrl);
        }
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send admin notification:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendNewsletterVerificationEmail(signupData: NewsletterSignupData): Promise<EmailResponse> {
    try {
      const { email, firstName, lastName, verificationToken } = signupData;
      
      const verificationUrl = `${config.urls.frontend}/verify-email?token=${verificationToken}`;
      const displayName = firstName ? `${firstName} ${lastName || ''}`.trim() : 'there';
      
      const emailTemplate = {
        from: `"The Code Muse Newsletter" <${config.email.fromEmail}>`,
        to: email,
        subject: 'Verify Your Newsletter Subscription - The Code Muse',
        headers: {
          'List-Unsubscribe': `<mailto:unsubscribe@thecodemuse.com?subject=unsubscribe>`,
          'X-Mailer': 'The Code Muse Newsletter',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal'
        },
        html: this.generateNewsletterVerificationHTML(displayName, verificationUrl),
        text: this.generateNewsletterVerificationText(displayName, verificationUrl)
      };
      
      const info = await this.transporter.sendMail(emailTemplate);
      
      // For development, show the preview URL
      if (config.nodeEnv === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info('📧 Newsletter Verification Email Preview URL:', previewUrl);
        }
      }
      
      return {
        success: true,
        messageId: info.messageId,
        verificationUrl
      };
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendNewsletterWelcomeEmail(verificationData: NewsletterVerificationData): Promise<EmailResponse> {
    try {
      const { email, firstName, lastName } = verificationData;
      
      const displayName = firstName ? `${firstName} ${lastName || ''}`.trim() : 'there';
      
      const emailTemplate = {
        from: `"The Code Muse Newsletter" <${config.email.fromEmail}>`,
        to: email,
        subject: 'Welcome to The Code Muse Newsletter! 🎉',
        html: this.generateNewsletterWelcomeHTML(displayName),
        text: this.generateNewsletterWelcomeText(displayName)
      };
      
      const info = await this.transporter.sendMail(emailTemplate);
      
      // For development, show the preview URL
      if (config.nodeEnv === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info('📧 Newsletter Welcome Email Preview URL:', previewUrl);
        }
      }
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendTestEmail(data: { to: string; subject: string; message: string }): Promise<EmailResponse> {
    try {
      const emailTemplate = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: `
          <h2>Test Email from Muse Email Service</h2>
          <p>${data.message}</p>
          <p><em>This is a test email sent at ${new Date().toISOString()}</em></p>
        `,
        text: `Test Email from Muse Email Service\n\n${data.message}\n\nThis is a test email sent at ${new Date().toISOString()}`
      };
      
      const info = await this.transporter.sendMail(emailTemplate);
      
      // For development, show the preview URL
      if (config.nodeEnv === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info('📧 Test Email Preview URL:', previewUrl);
        }
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send test email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // HTML Template Generators
  private generateWelcomeEmailHTML(name: string, subject: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for contacting us</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank you for reaching out!</h1>
          <p>We've received your message and will get back to you soon.</p>
        </div>
        
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <p>Thank you for contacting <strong>The Code Muse</strong>. We've received your message and appreciate you taking the time to reach out to us.</p>
          
          <h3>Your Message Details:</h3>
          <ul>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Message:</strong> ${message}</li>
          </ul>
          
          <p>We typically respond to inquiries within 24 hours during business days. In the meantime, feel free to explore our latest articles and tutorials.</p>
          
          <a href="${config.urls.frontend}/blog" class="button">Explore Our Blog</a>
          
          <p>If you have any urgent questions, you can also reach us directly at <a href="mailto:${config.email.fromEmail}">${config.email.fromEmail}</a>.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Code Muse Team</p>
            <p><small>This is an automated response to your contact form submission. Please do not reply to this email directly.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(name: string, subject: string, message: string): string {
    return `
Thank you for contacting The Code Muse!

Hello ${name},

Thank you for contacting The Code Muse. We've received your message and appreciate you taking the time to reach out to us.

Your Message Details:
- Subject: ${subject}
- Message: ${message}

We typically respond to inquiries within 24 hours during business days. In the meantime, feel free to explore our latest articles and tutorials at ${config.urls.frontend}/blog

If you have any urgent questions, you can also reach us directly at ${config.email.fromEmail}.

Best regards,
The Code Muse Team

This is an automated response to your contact form submission. Please do not reply to this email directly.
    `;
  }

  private generateAdminNotificationHTML(
    name: string, 
    email: string, 
    subject: string, 
    message: string, 
    documentId?: string, 
    createdAt?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #374151; }
          .field-value { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #0ea5e9; }
          .metadata { background: #f1f5f9; padding: 15px; border-radius: 4px; margin-top: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Contact Form Submission</h1>
          <p>A new message has been submitted through the contact form.</p>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="field-label">From:</div>
            <div class="field-value">${name} (${email})</div>
          </div>
          
          <div class="field">
            <div class="field-label">Subject:</div>
            <div class="field-value">${subject}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Message:</div>
            <div class="field-value">${message}</div>
          </div>
          
          <div class="metadata">
            <strong>Submission Details:</strong><br>
            <strong>Date:</strong> ${createdAt ? new Date(createdAt).toLocaleString() : 'Not available'}<br>
            <strong>IP Address:</strong> ${ipAddress || 'Not available'}<br>
            <strong>User Agent:</strong> ${userAgent || 'Not available'}<br>
            <strong>Submission ID:</strong> ${documentId || 'Not available'}
          </div>
          
          <p style="margin-top: 20px;">
            <a href="${config.urls.admin}/admin/content-manager/collection-types/api::contact-submission.contact-submission/${documentId}" 
               style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View in Admin Panel
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private generateAdminNotificationText(
    name: string, 
    email: string, 
    subject: string, 
    message: string, 
    documentId?: string, 
    createdAt?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): string {
    return `
New Contact Form Submission

From: ${name} (${email})
Subject: ${subject}
Message: ${message}

Submission Details:
Date: ${createdAt ? new Date(createdAt).toLocaleString() : 'Not available'}
IP Address: ${ipAddress || 'Not available'}
User Agent: ${userAgent || 'Not available'}
Submission ID: ${documentId || 'Not available'}

View in Admin Panel: ${config.urls.admin}/admin/content-manager/collection-types/api::contact-submission.contact-submission/${documentId}
    `;
  }

  private generateNewsletterVerificationHTML(displayName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Newsletter Subscription</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to The Code Muse Newsletter!</h1>
            <p>One more step to complete your subscription</p>
          </div>
          
          <div class="content">
            <h2>Hi ${displayName},</h2>
            
            <p>Thank you for subscribing to The Code Muse newsletter! We're excited to share programming insights, tutorials, and tech tips with you.</p>
            
            <p><strong>To complete your subscription, please verify your email address:</strong></p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to sign up again.
            </div>
            
            <p>If you didn't sign up for our newsletter, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The Code Muse Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent because you signed up for The Code Muse newsletter.</p>
            <p>© ${new Date().getFullYear()} The Code Muse. All rights reserved.</p>
            <p>
              <a href="${config.urls.frontend}/privacy" style="color: #667eea;">Privacy Policy</a> | 
              <a href="${config.urls.frontend}/terms" style="color: #667eea;">Terms of Service</a> | 
              <a href="mailto:unsubscribe@thecodemuse.com?subject=unsubscribe" style="color: #667eea;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNewsletterVerificationText(displayName: string, verificationUrl: string): string {
    return `
Welcome to The Code Muse Newsletter!

Hi ${displayName},

Thank you for subscribing to The Code Muse newsletter! We're excited to share programming insights, tutorials, and tech tips with you.

To complete your subscription, please verify your email address by clicking this link:

${verificationUrl}

Or copy and paste the link into your browser.

IMPORTANT: This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to sign up again.

If you didn't sign up for our newsletter, you can safely ignore this email.

Best regards,
The Code Muse Team

---
This email was sent because you signed up for The Code Muse newsletter.
© ${new Date().getFullYear()} The Code Muse. All rights reserved.
Privacy Policy: ${config.urls.frontend}/privacy
Terms of Service: ${config.urls.frontend}/terms
Unsubscribe: mailto:unsubscribe@thecodemuse.com?subject=unsubscribe
    `;
  }

  private generateNewsletterWelcomeHTML(displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to The Code Muse Newsletter</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to The Code Muse Newsletter!</h1>
            <p>Your subscription is now active</p>
          </div>
          
          <div class="content">
            <h2>Hi ${displayName},</h2>
            
            <p>Great news! Your email has been verified and you're now subscribed to The Code Muse newsletter.</p>
            
            <p>You'll receive our latest programming insights, tutorials, and tech tips delivered straight to your inbox.</p>
            
            <div style="text-align: center;">
              <a href="${config.urls.frontend}/blog" class="button">Explore Our Blog</a>
            </div>
            
            <p>We're excited to have you as part of our community!</p>
            
            <p>Best regards,<br>The Code Muse Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNewsletterWelcomeText(displayName: string): string {
    return `
Welcome to The Code Muse Newsletter!

Hi ${displayName},

Great news! Your email has been verified and you're now subscribed to The Code Muse newsletter.

You'll receive our latest programming insights, tutorials, and tech tips delivered straight to your inbox.

Explore our blog: ${config.urls.frontend}/blog

We're excited to have you as part of our community!

Best regards,
The Code Muse Team
    `;
  }
}

// Export singleton instance
export const emailService = new EmailServiceImpl();
