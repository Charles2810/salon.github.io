import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  crearReservaAdmin,
  listarReservasPorFechaAdmin,
  cancelarReserva,
  registrarTrabajo,
  listarMetodosPago,
  registrarPago,
} from '../controllers/reservasTrabajosPagosAdminController';

const router = Router();

router.use(authMiddleware, requireRoles('ADMIN'));

// Reservas
router.post('/reservas', crearReservaAdmin);
router.get('/reservas', listarReservasPorFechaAdmin); // ?fecha_inicio&fecha_fin&page&pageSize
router.patch('/reservas/:id/cancelar', cancelarReserva);

// Trabajos / Pagos
router.post('/trabajos', registrarTrabajo);
router.get('/metodos-pago', listarMetodosPago);
router.post('/pagos', registrarPago);

export default router;

