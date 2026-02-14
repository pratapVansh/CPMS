import * as settingsController from '../controllers/settings.controller';
import { Router } from 'express';
import * as superadminController from '../controllers/superadmin.controller';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// Admin Management Routes
router.post('/admins', superadminController.createAdmin);
router.get('/admins', superadminController.getAdmins);
router.get('/admins/:id', superadminController.getAdmin);
router.patch('/admins/:id', superadminController.updateAdmin);
router.patch('/admins/:id/status', superadminController.disableAdmin);
router.delete('/admins/:id', superadminController.deleteAdmin);

// Super Admin Management Routes
router.get('/super-admins', superadminController.getSuperAdmins);
router.post('/super-admins', superadminController.createSuperAdmin);
router.delete('/super-admins/:id', superadminController.deleteSuperAdmin);

// Audit Logs
router.get('/audit-logs', superadminController.getAuditLogs);

//settings:

router.get('/settings', settingsController.getSettings);
router.patch('/settings/smtp', settingsController.updateSMTPSettings);
router.post('/settings/smtp/test', settingsController.testSMTP);

router.patch('/settings/institution', settingsController.updateInstitutionSettings);
router.patch('/settings/placement', settingsController.updatePlacementSettings);
router.patch('/settings/student', settingsController.updateStudentSettings);
router.patch('/settings/company', settingsController.updateCompanySettings);
router.patch('/settings/notification', settingsController.updateNotificationSettings);
router.patch('/settings/security', settingsController.updateSecuritySettings);
router.patch('/settings/appearance', settingsController.updateAppearanceSettings);

export default router;
