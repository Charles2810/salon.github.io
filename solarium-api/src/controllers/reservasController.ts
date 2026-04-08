import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { resolverCliente } from './clientesController';

export async function crearReserva(req: Request, res: Response): Promise<void> {
  const { nombre, apellido, email, telefono, id_servicio, id_empleado, fecha_reserva, hora_reserva, observaciones } = req.body;

  // Validar campos requeridos
  if (!nombre || !apellido || !email || !telefono || !id_servicio || !id_empleado || !fecha_reserva || !hora_reserva) {
    res.status(400).json({ error: 'Todos los campos son requeridos' });
    return;
  }

  try {
    const pool = await getPool();

    // Verificar que el servicio existe y está activo
    const servicioResult = await pool.request()
      .input('id_servicio', sql.Int, id_servicio)
      .query('SELECT ID_SERVICIO FROM SERVICIOS WHERE ID_SERVICIO = @id_servicio AND ESTADO = \'ACTIVO\'');

    if (servicioResult.recordset.length === 0) {
      res.status(422).json({ error: 'El servicio no existe o no está disponible' });
      return;
    }

    // Verificar que el empleado (usuario) existe y está activo
    const empleadoResult = await pool.request()
      .input('id_usuario', sql.Int, id_empleado)
      .query('SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = @id_usuario AND ESTADO = \'ACTIVO\'');

    if (empleadoResult.recordset.length === 0) {
      res.status(422).json({ error: 'El empleado no existe o no está disponible' });
      return;
    }

    // Resolver o crear cliente
    const id_cliente = await resolverCliente(pool, email, nombre, apellido, telefono);

    // Insertar reserva
    const insertResult = await pool.request()
      .input('id_cliente',    sql.Int,         id_cliente)
      .input('id_servicio',   sql.Int,         id_servicio)
      .input('id_usuario',    sql.Int,         id_empleado)
      .input('fecha_reserva', sql.Date,        fecha_reserva)
      .input('hora_reserva',  sql.VarChar(8),  hora_reserva?.length === 5 ? `${hora_reserva}:00` : hora_reserva)
      .input('observacion',   sql.VarChar(255), observaciones ?? null)
      .query(`
        INSERT INTO RESERVAS (ID_CLIENTE, ID_SERVICIO, ID_USUARIO, FECHA_RESERVA, HORA_RESERVA, ESTADO, OBSERVACION)
        VALUES (@id_cliente, @id_servicio, @id_usuario, @fecha_reserva, @hora_reserva, 'PENDIENTE', @observacion);
        SELECT SCOPE_IDENTITY() AS id_reserva;
      `);

    const id_reserva = insertResult.recordset[0]?.id_reserva ?? null;
    res.status(201).json({ id_reserva, mensaje: 'Reserva creada exitosamente' });

  } catch (err) {
    console.error('Error crearReserva:', err);
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
      .query(`
        SELECT
          r.ID_RESERVA AS id_reserva,
          c.NOMBRE + ' ' + c.APELLIDO AS cliente,
          s.NOMBRE AS servicio,
          u.NOMBRE + ' ' + u.APELLIDO AS empleado,
          CONVERT(VARCHAR, r.FECHA_RESERVA, 23) AS fecha_reserva,
          CONVERT(VARCHAR, r.HORA_RESERVA, 8) AS hora_reserva,
          r.ESTADO AS estado,
          r.OBSERVACION AS observacion
        FROM RESERVAS r
        JOIN CLIENTES c  ON r.ID_CLIENTE  = c.ID_CLIENTE
        JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
        JOIN USUARIOS u  ON r.ID_USUARIO  = u.ID_USUARIO
        WHERE r.FECHA_RESERVA BETWEEN @fecha_inicio AND @fecha_fin
        ORDER BY r.FECHA_RESERVA, r.HORA_RESERVA
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarReservasPorFecha:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
