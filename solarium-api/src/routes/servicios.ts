import { Router } from 'express';
import { listarServicios, listarPorCategoria, listarCategorias } from '../controllers/serviciosController';

const router = Router();

router.get('/servicios', listarServicios);
router.get('/servicios/categoria/:id', listarPorCategoria);
router.get('/categorias', listarCategorias);

export default router;
