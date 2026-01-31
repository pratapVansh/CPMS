import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  uploadDocuments,
  handleMulterError,
  validatePdfContent,
} from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.post(
  '/register',
  uploadDocuments,
  handleMulterError,
  validatePdfContent,
  authController.register
);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.post('/logout-all', requireAuth, authController.logoutAll);
router.get('/me', requireAuth, authController.me);

export default router;
