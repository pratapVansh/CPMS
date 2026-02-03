import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth, requireStudent } from '../middleware/auth.middleware';
import {
  uploadResume,
  uploadMarksheet,
  handleMulterError,
  validatePdfContent,
} from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication and STUDENT role
router.use(requireAuth);
router.use(requireStudent);

// Profile
router.get('/', profileController.getProfile);
router.patch('/cpi', profileController.updateCpi);
router.patch('/year-semester', profileController.updateYearSemester);

// Resume upload
router.post(
  '/resume',
  uploadResume,
  handleMulterError,
  validatePdfContent,
  profileController.uploadResume
);
router.delete('/resume', profileController.deleteResume);

// Marksheet upload
router.post(
  '/marksheet',
  uploadMarksheet,
  handleMulterError,
  validatePdfContent,
  profileController.uploadMarksheet
);
router.delete('/marksheet', profileController.deleteMarksheet);

// Get document URL (generates fresh signed URL)
router.get('/document/:type', profileController.getDocumentUrl);

export default router;
