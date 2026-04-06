import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  listarReservasHoy,
  listarCategorias, crearCategoria, actualizarCategoria, desactivarCategoria,
  listarServiciosAdmin, crearServicio, actualizarServicio, desactivarServicio,
  listarClientesAdmin,
  listarUsuariosAdmin,
  listarReservasAdmin, crearReservaAdmin, cancelarReserva,
  crearTrabajo,
  crearPago, listarMetodosPago,
  bitacoraKpis, bitacoraReciente, bitacoraActividadDia,
  listarStoredProcedures,
  reporteReservas, reporteUsuarios, reportePagos, reporteServicios,
} from '../controllers/adminController';

const router = Router();
const auth = [authMiddleware, requireRoles('ADMIN', 'ESTILISTA', 'MANICURISTA', 'RECEPCIONISTA', 'EMPLEADO')];
const adminOnly = [authMiddleware, requireRoles('ADMIN')];

// Reservas del día
router.get('/reservas', ...auth, listarReservasHoy);

// Categorías
router.get('/categorias', ...auth, listarCategorias);
router.post('/categorias', ...auth, crearCategoria);
router.put('/categorias/:id', ...auth, actualizarCategoria);
router.delete('/categorias/:id', ...auth, desactivarCategoria);

// Servicios
router.get('/servicios', ...auth, listarServiciosAdmin);
router.post('/servicios', ...auth, crearServicio);
router.put('/servicios/:id', ...auth, actualizarServicio);
router.delete('/servicios/:id', ...auth, desactivarServicio);

// Clientes
router.get('/clientes', ...auth, listarClientesAdmin);

// Usuarios
router.get('/usuarios', ...auth, listarUsuariosAdmin);

// Roles (para combos)
router.get('/roles', ...auth, async (_req, res) => {
  try {
    const { getPool } = await import('../db/pool');
    const pool = await getPool();
    const r = await pool.request().query(
      "SELECT ID_ROL AS id_rol, NOMBRE AS nombre, ESTADO AS estado FROM ROLES WHERE ESTADO='ACTIVO' ORDER BY NOMBRE"
    );
    res.json(r.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reservas admin (con filtro fecha)
router.get('/reservas-admin', ...auth, listarReservasAdmin);
router.post('/reservas', ...auth, crearReservaAdmin);
router.patch('/reservas/:id/cancelar', ...auth, cancelarReserva);

// Trabajos
router.post('/trabajos', ...auth, crearTrabajo);

// Pagos
router.get('/metodos-pago', ...auth, listarMetodosPago);
router.post('/pagos', ...auth, crearPago);

// Bitácora — solo ADMIN
router.get('/bitacora/kpis', ...adminOnly, bitacoraKpis);
router.get('/bitacora/reciente', ...adminOnly, bitacoraReciente);
router.get('/bitacora/actividad-dia', ...adminOnly, bitacoraActividadDia);

// Stored Procedures — solo ADMIN
router.get('/stored-procedures', ...adminOnly, listarStoredProcedures);

// Reportes — solo ADMIN
router.get('/reportes/reservas',  ...adminOnly, reporteReservas);
router.get('/reportes/usuarios',  ...adminOnly, reporteUsuarios);
router.get('/reportes/pagos',     ...adminOnly, reportePagos);
router.get('/reportes/servicios', ...adminOnly, reporteServicios);

export default router;
