import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { resolverCliente } from './clientesController';
import { combinarFechaHora } from '../utils/dateUtils';
import { BodyCrearReserva, EstadoReserva } from '../types';

const ESTADOS_VALIDOS: EstadoReserva[] = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PROCESO',
  'COMPLETADO',
  'CANCELADO',
];

const CAMPOS_REQUERIDOS: (keyof BodyCrearReserva)[] = [
  'nombre',
  'apellido',
  'email',
  'telefono',
  'id_servicio',
  'id_empleado',
  'fecha_reserva',
  'hora_reserva',
];

export async function crearReserva(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<BodyCrearReserva>;

  // 1. Validar campos requeridos
  for (const campo of CAMPOS_REQUERIDOS) {
    if (body[campo] === undefined || body[campo] === null || body[campo] === '') {
      res.status(400).json({ error: `El campo '${campo}' es requerido` });
      return;
    }
  }

  const {
    nombre,
    apellido,
    email,
    telefono,
    id_servicio,
    id_empleado,
    fecha_reserva,
    hora_reserva,
    observaciones,
  } = body as BodyCrearReserva;

  try {
    const pool = await getPool();

    // 2. Verificar que el servicio existe y está activo
    const servicioResult = await pool.request()
      .input('id_servicio', sql.Int, id_servicio)
      .query('SELECT id_servicio FROM Servicio WHERE id_servicio = @id_servicio AND activo = 1');

    if (servicioResult.recordset.length === 0) {
      res.status(422).json({ error: 'El servicio no existe o no está disponible' });
      return;
    }

    // 3. Verificar que el empleado existe y está activo
    const empleadoResult = await pool.request()
      .input('id_empleado', sql.Int, id_empleado)
      .query('SELECT id_empleado FROM Empleado WHERE id_empleado = @id_empleado AND activo = 1');

    if (empleadoResult.recordset.length === 0) {
      res.status(422).json({ error: 'El empleado no existe o no está disponible' });
      return;
    }

    // 4. Resolver o crear cliente
    const id_cliente = await resolverCliente(pool, email, nombre, apellido, telefono);

    // 5. Combinar fecha y hora
    const fechaReserva = combinarFechaHora(fecha_reserva, hora_reserva);

    // 6. Ejecutar sp_CrearReserva
    await pool.request()
      .input('id_cliente',    sql.Int,          id_cliente)
      .input('id_empleado',   sql.Int,          id_empleado)
      .input('id_servicio',   sql.Int,          id_servicio)
      .input('fecha_reserva', sql.DateTime,     fechaReserva)
      .input('observaciones', sql.VarChar(500), observaciones ?? null)
      .execute('sp_CrearReserva');

    // 7. Obtener el ID del trabajo recién creado
    const idResult = await pool.request()
      .input('id_cliente', sql.Int, id_cliente)
      .query('SELECT TOP 1 id_trabajo FROM Trabajo WHERE id_cliente = @id_cliente ORDER BY id_trabajo DESC');

    const id_trabajo = idResult.recordset[0]?.id_trabajo ?? null;

    res.status(201).json({ id_trabajo, mensaje: 'Reserva creada exitosamente' });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID de reserva inválido' });
    return;
  }

  const { estado } = req.body as { estado?: string };

  if (!estado) {
    res.status(400).json({ error: "El campo 'estado' es requerido" });
    return;
  }

  if (!ESTADOS_VALIDOS.includes(estado as EstadoReserva)) {
    res.status(422).json({
      error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
    });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_trabajo',    sql.Int,        id)
      .input('nuevo_estado',  sql.VarChar(20), estado)
      .execute('sp_CambiarEstadoReserva');

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    res.json({ id_trabajo: id, estado });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarReservasPorFecha(req: Request, res: Response): Promise<void> {
  const { fecha_inicio, fecha_fin } = req.query as { fecha_inicio?: string; fecha_fin?: string };

  if (!fecha_inicio || !fecha_fin) {
    res.status(400).json({ error: "Los parámetros 'fecha_inicio' y 'fecha_fin' son requeridos" });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('fecha_inicio', sql.Date, fecha_inicio)
      .input('fecha_fin',    sql.Date, fecha_fin)
      .execute('sp_ReservasPorFecha');

    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
