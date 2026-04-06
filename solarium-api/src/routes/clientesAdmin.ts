import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  listarClientes,
  crearCliente,
  editarCliente,
  eliminarCliente,
  historialCliente,
} from '../controllers/clientesAdminController';

const router = Router();

router.use(authMiddleware, requireRoles('ADMIN'));

router.get('/clientes', listarClientes); // ?page=&pageSize=&q=
router.post('/clientes', crearCliente);
router.put('/clientes/:id', editarCliente);
router.delete('/clientes/:id', eliminarCliente);
router.get('/clientes/:id/historial', historialCliente);

export default router;

