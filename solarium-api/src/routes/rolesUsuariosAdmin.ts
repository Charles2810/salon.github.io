import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  listarRoles,
  crearRol,
  editarRol,
  desactivarRol,
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  cambiarRolUsuario,
  desactivarUsuario,
} from '../controllers/rolesUsuariosAdminController';

const router = Router();

router.use(authMiddleware, requireRoles('ADMIN'));

// Roles
router.get('/roles', listarRoles);
router.post('/roles', crearRol);
router.put('/roles/:id', editarRol);
router.delete('/roles/:id', desactivarRol);

// Usuarios
router.get('/usuarios', listarUsuarios); // ?page=&pageSize=&q=
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', editarUsuario);
router.patch('/usuarios/:id/rol', cambiarRolUsuario);
router.delete('/usuarios/:id', desactivarUsuario);

export default router;

