import { Router } from 'express';
import { buscarClientes } from '../controllers/clientesController';

const router = Router();

router.get('/clientes/buscar', buscarClientes);

export default router;
