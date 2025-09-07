import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { emailController } from '@/controllers/emailController';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Contact form email routes
router.post('/contact/welcome',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required and must be less than 200 characters'),
    body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required and must be less than 5000 characters'),
    body('documentId').optional().isString(),
    body('createdAt').optional().isISO8601(),
    body('ipAddress').optional().isIP(),
    body('userAgent').optional().isString()
  ],
  validateRequest,
  asyncHandler(emailController.sendWelcomeEmail)
);

router.post('/contact/admin',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required and must be less than 200 characters'),
    body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required and must be less than 5000 characters'),
    body('documentId').optional().isString(),
    body('createdAt').optional().isISO8601(),
    body('ipAddress').optional().isIP(),
    body('userAgent').optional().isString()
  ],
  validateRequest,
  asyncHandler(emailController.sendAdminNotification)
);

// Newsletter email routes
router.post('/newsletter/verification',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters'),
    body('verificationToken').isString().isLength({ min: 32 }).withMessage('Valid verification token is required'),
    body('source').isString().isLength({ min: 1, max: 50 }).withMessage('Source is required and must be less than 50 characters'),
    body('sourceUrl').optional().custom((value) => {
      if (!value) return true; // Optional field
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }).withMessage('Source URL must be a valid URL')
  ],
  validateRequest,
  asyncHandler(emailController.sendNewsletterVerificationEmail)
);

router.post('/newsletter/welcome',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters')
  ],
  validateRequest,
  asyncHandler(emailController.sendNewsletterWelcomeEmail)
);

export { router as emailRouter };
