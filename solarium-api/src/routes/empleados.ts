import { Router } from 'express';
import { listarEmpleados } from '../controllers/empleadosController';

const router = Router();

router.get('/empleados', listarEmpleados);

export default router;
