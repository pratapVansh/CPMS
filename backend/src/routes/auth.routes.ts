import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  uploadDocuments,
  handleMulterError,
  validatePdfContent,
} from '../middleware/upload.middleware';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  uploadDocuments,
  handleMulterError,
  validatePdfContent,
  authController.register
);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.post('/logout-all', requireAuth, authController.logoutAll);
router.get('/me', requireAuth, authController.me);

export default router;
