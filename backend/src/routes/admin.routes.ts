import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireAdmin);

// Companies
router.post('/companies', adminController.createCompany);
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/:id', adminController.getCompanyApplicants);
router.get('/companies/:id/applicants', adminController.getCompanyApplicants);

// Applications
router.put('/applications/:id/status', adminController.updateApplicationStatus);

// Students
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentProfile);
router.get('/students/:id/document/:type', adminController.getStudentDocument);

// Stats
router.get('/stats', adminController.getStats);

export default router;
