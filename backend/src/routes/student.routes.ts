import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { requireAuth, requireStudent, requireVerifiedStudent } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and STUDENT role
router.use(requireAuth);
router.use(requireStudent);

// Companies
router.get('/companies/eligible', studentController.getEligibleCompanies);

// Applications
router.post('/applications/apply', requireVerifiedStudent, studentController.applyToCompany);
router.get('/applications/my', studentController.getMyApplications);

// Resume
router.post('/resume', studentController.upsertResume);
router.get('/resume', studentController.getResume);

// Notices
router.get('/notices', studentController.getNotices);

export default router;
