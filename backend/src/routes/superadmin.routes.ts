import { Router } from 'express';
import * as superadminController from '../controllers/superadmin.controller';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.post('/admin', superadminController.createAdmin);
router.get('/admins', superadminController.getAdmins);
router.get('/admin/:id', superadminController.getAdmin);
router.patch('/admin/:id', superadminController.updateAdmin);
router.patch('/admin/:id/disable', superadminController.disableAdmin);
router.delete('/admin/:id', superadminController.deleteAdmin);

router.get('/audit-logs', superadminController.getAuditLogs);

export default router;
