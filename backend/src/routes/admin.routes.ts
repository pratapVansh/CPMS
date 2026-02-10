import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as bulkCommController from '../controllers/bulk-communication.controller';
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
router.get('/students/:id/document/:type/preview', adminController.getStudentDocumentPreview);

// Stats
router.get('/stats', adminController.getStats);
router.get('/reports', adminController.getReports);

// Notices
router.post('/notices', adminController.createNotice);
router.get('/notices', adminController.getAllNotices);
router.put('/notices/:id', adminController.updateNotice);
router.delete('/notices/:id', adminController.deleteNotice);

// ==================== BULK COMMUNICATION ====================

// Campaign Management
router.post('/drives/:driveId/campaigns', bulkCommController.createCampaign);
router.get('/drives/:driveId/campaigns', bulkCommController.getDriveCampaigns);
router.get('/campaigns/:campaignId', bulkCommController.getCampaignDetails);
router.get('/campaigns/:campaignId/stats', bulkCommController.getCampaignStats);

// Send Campaign
router.post('/campaigns/:campaignId/send', bulkCommController.sendCampaign);

// Preview & Validation
router.post('/drives/:driveId/preview-email', bulkCommController.previewEmail);
router.post('/drives/:driveId/resolve-recipients', bulkCommController.resolveRecipients);

// Templates
router.get('/message-templates', bulkCommController.getDefaultTemplates);
router.post('/message-templates', bulkCommController.upsertTemplate);

export default router;
