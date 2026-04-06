import { Router } from 'express';
import { crearReserva, listarReservasPorFecha } from '../controllers/reservasController';

const router = Router();

router.post('/reservas', crearReserva);
router.get('/reservas', listarReservasPorFecha);

export default router;
