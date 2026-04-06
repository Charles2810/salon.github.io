import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import { actividadPorDia, kpisBitacora, recienteBitacora } from '../controllers/bitacoraAdminController';

const router = Router();

router.use(authMiddleware, requireRoles('ADMIN'));

router.get('/bitacora/kpis', kpisBitacora);
router.get('/bitacora/reciente', recienteBitacora);
router.get('/bitacora/actividad-dia', actividadPorDia);

export default router;

