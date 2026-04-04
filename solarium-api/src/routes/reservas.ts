import { Router } from 'express';
import { crearReserva, cambiarEstado, listarReservasPorFecha } from '../controllers/reservasController';

const router = Router();

router.post('/reservas', crearReserva);
router.patch('/reservas/:id/estado', cambiarEstado);
router.get('/reservas', listarReservasPorFecha);

export default router;
