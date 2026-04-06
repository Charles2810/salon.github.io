import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  listarCategoriasAdmin,
  crearCategoria,
  editarCategoria,
  desactivarCategoria,
  listarServiciosAdmin,
  crearServicio,
  editarServicio,
  desactivarServicio,
} from '../controllers/catalogosAdminController';

const router = Router();

router.use(authMiddleware, requireRoles('ADMIN'));

// Categorías
router.get('/categorias', listarCategoriasAdmin);
router.post('/categorias', crearCategoria);
router.put('/categorias/:id', editarCategoria);
router.delete('/categorias/:id', desactivarCategoria);

// Servicios
router.get('/servicios', listarServiciosAdmin); // admite ?id_categoria=&page=&pageSize=
router.post('/servicios', crearServicio);
router.put('/servicios/:id', editarServicio);
router.delete('/servicios/:id', desactivarServicio);

export default router;

