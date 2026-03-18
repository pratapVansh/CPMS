import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth, requireStudent } from '../middleware/auth.middleware';
import {
  uploadResume,
  uploadMarksheet,
  handleMulterError,
  validatePdfContent,
} from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication and STUDENT role
router.use(requireAuth);
router.use(requireStudent);

// Profile
router.get('/', profileController.getProfile);
router.patch('/cpi', profileController.updateCpi);
router.patch('/year-semester', profileController.updateYearSemester);
router.patch('/info', profileController.updateProfileInfo);
router.patch('/email', profileController.updateEmail);

// Resume upload
router.post(
  '/resume',
  uploadLimiter,
  uploadResume,
  handleMulterError,
  validatePdfContent,
  profileController.uploadResume
);
router.delete('/resume', profileController.deleteResume);

// Marksheet upload
router.post(
  '/marksheet',
  uploadLimiter,
  uploadMarksheet,
  handleMulterError,
  validatePdfContent,
  profileController.uploadMarksheet
);
router.delete('/marksheet', profileController.deleteMarksheet);

// Get document URLs (preview for inline viewing)
router.get('/document/:type/preview', profileController.getDocumentPreviewUrl);

export default router;
