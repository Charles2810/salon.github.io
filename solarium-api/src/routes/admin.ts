import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import { listarReservasHoy } from '../controllers/adminController';

const router = Router();

router.get(
  '/reservas',
  authMiddleware,
  requireRoles('ADMIN', 'ESTILISTA', 'MANICURISTA', 'RECEPCIONISTA', 'EMPLEADO'),
  listarReservasHoy
);

export default router;
