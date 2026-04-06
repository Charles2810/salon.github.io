import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { tableExists } from '../db/metadata';
import { logOperacion } from '../utils/bitacora';

function actor(req: Request): number | null {
  return req.user?.id_usuario ?? null;
}

export async function crearReservaAdmin(req: Request, res: Response): Promise<void> {
  const { id_cliente, id_servicio, id_usuario, fecha_reserva, hora_reserva, observacion } = req.body as {
    id_cliente?: number;
    id_servicio?: number;
    id_usuario?: number;
    fecha_reserva?: string;
    hora_reserva?: string;
    observacion?: string | null;
  };

  if (!id_cliente || !id_servicio || !id_usuario || !fecha_reserva || !hora_reserva) {
    res.status(400).json({ error: 'Campos requeridos: id_cliente, id_servicio, id_usuario, fecha_reserva, hora_reserva' });
    return;
  }

  try {
    const pool = await getPool();
    const insert = await pool.request()
      .input('id_cliente', sql.Int, id_cliente)
      .input('id_servicio', sql.Int, id_servicio)
      .input('id_usuario', sql.Int, id_usuario)
      .input('fecha', sql.Date, fecha_reserva)
      .input('hora', sql.VarChar(8), hora_reserva)
      .input('observacion', sql.VarChar(255), (observacion ?? null) as any)
      .query(`
        INSERT INTO RESERVAS (ID_CLIENTE, ID_SERVICIO, ID_USUARIO, FECHA_RESERVA, HORA_RESERVA, ESTADO, OBSERVACION)
        VALUES (@id_cliente, @id_servicio, @id_usuario, @fecha, @hora, 'PENDIENTE', @observacion);
        SELECT SCOPE_IDENTITY() AS id_reserva;
      `);

    const id_reserva = insert.recordset[0]?.id_reserva ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'RESERVAS',
      id_registro: id_reserva ? Number(id_reserva) : null,
      descripcion: 'Crear reserva (admin)',
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_reserva, mensaje: 'Reserva creada' });
  } catch (err) {
    console.error('Error crearReservaAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarReservasPorFechaAdmin(req: Request, res: Response): Promise<void> {
  const { fecha_inicio, fecha_fin } = req.query as { fecha_inicio?: string; fecha_fin?: string };
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  if (!fecha_inicio || !fecha_fin) {
    res.status(400).json({ error: "Los parámetros 'fecha_inicio' y 'fecha_fin' son requeridos" });
    return;
  }

  try {
    const pool = await getPool();
    const totalResult = await pool.request()
      .input('ini', sql.Date, fecha_inicio)
      .input('fin', sql.Date, fecha_fin)
      .query(`SELECT COUNT(1) AS total FROM RESERVAS WHERE FECHA_RESERVA BETWEEN @ini AND @fin`);
    const total = totalResult.recordset[0]?.total ?? 0;

    const hasTrabajos = await tableExists('TRABAJOS');
    const hasPagos = await tableExists('PAGOS');

    const result = await pool.request()
      .input('ini', sql.Date, fecha_inicio)
      .input('fin', sql.Date, fecha_fin)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .query(`
        SELECT
          r.ID_RESERVA AS id_reserva,
          c.ID_CLIENTE AS id_cliente,
          c.NOMBRE + ' ' + c.APELLIDO AS cliente,
          s.ID_SERVICIO AS id_servicio,
          s.NOMBRE AS servicio,
          u.ID_USUARIO AS id_usuario,
          u.NOMBRE + ' ' + u.APELLIDO AS usuario,
          CONVERT(VARCHAR, r.FECHA_RESERVA, 23) AS fecha_reserva,
          CONVERT(VARCHAR, r.HORA_RESERVA, 8) AS hora_reserva,
          r.ESTADO AS estado,
          r.OBSERVACION AS observacion
          ${hasTrabajos ? ', t.ID_TRABAJO AS id_trabajo, t.ESTADO AS estado_trabajo' : ', NULL AS id_trabajo, NULL AS estado_trabajo'}
          ${hasPagos ? ', p.ID_PAGO AS id_pago, p.ESTADO AS estado_pago' : ', NULL AS id_pago, NULL AS estado_pago'}
        FROM RESERVAS r
        JOIN CLIENTES c  ON r.ID_CLIENTE  = c.ID_CLIENTE
        JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
        JOIN USUARIOS u  ON r.ID_USUARIO  = u.ID_USUARIO
        ${hasTrabajos ? 'LEFT JOIN TRABAJOS t ON t.ID_RESERVA = r.ID_RESERVA' : ''}
        ${hasPagos && hasTrabajos ? 'LEFT JOIN PAGOS p ON p.ID_TRABAJO = t.ID_TRABAJO' : ''}
        WHERE r.FECHA_RESERVA BETWEEN @ini AND @fin
        ORDER BY r.FECHA_RESERVA DESC, r.HORA_RESERVA DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarReservasPorFechaAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function cancelarReserva(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE RESERVAS SET ESTADO = 'CANCELADO' WHERE ID_RESERVA = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'RESERVAS',
      id_registro: id,
      descripcion: 'Cancelar reserva',
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Reserva cancelada' });
  } catch (err) {
    console.error('Error cancelarReserva:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function registrarTrabajo(req: Request, res: Response): Promise<void> {
  const { id_reserva, estado, notas } = req.body as {
    id_reserva?: number;
    estado?: 'COMPLETADO' | 'INCOMPLETO' | 'ANULADO';
    notas?: string | null;
  };

  if (!id_reserva || !estado) {
    res.status(400).json({ error: 'Campos requeridos: id_reserva, estado' });
    return;
  }
  if (!['COMPLETADO', 'INCOMPLETO', 'ANULADO'].includes(estado)) {
    res.status(400).json({ error: 'Estado de trabajo inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const exists = await tableExists('TRABAJOS');
    if (!exists) {
      res.status(422).json({ error: 'La tabla TRABAJOS no existe. Ejecuta el script sql/setup_modulos.sql' });
      return;
    }

    const insert = await pool.request()
      .input('id_reserva', sql.Int, id_reserva)
      .input('estado', sql.VarChar(20), estado)
      .input('notas', sql.VarChar(255), (notas ?? null) as any)
      .query(`
        INSERT INTO TRABAJOS (ID_RESERVA, ESTADO, NOTAS)
        VALUES (@id_reserva, @estado, @notas);
        SELECT SCOPE_IDENTITY() AS id_trabajo;
      `);

    const id_trabajo = insert.recordset[0]?.id_trabajo ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'TRABAJOS',
      id_registro: id_trabajo ? Number(id_trabajo) : null,
      descripcion: 'Registrar trabajo',
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_trabajo, mensaje: 'Trabajo registrado' });
  } catch (err) {
    console.error('Error registrarTrabajo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarMetodosPago(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const exists = await tableExists('METODOS_PAGO');
    if (!exists) {
      res.status(200).json([]);
      return;
    }
    const result = await pool.request().query(`
      SELECT ID_METODO_PAGO AS id_metodo_pago, NOMBRE AS nombre
      FROM METODOS_PAGO
      WHERE ESTADO = 'ACTIVO'
      ORDER BY NOMBRE
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarMetodosPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function registrarPago(req: Request, res: Response): Promise<void> {
  const { id_trabajo, id_metodo_pago, monto, estado } = req.body as {
    id_trabajo?: number;
    id_metodo_pago?: number;
    monto?: number;
    estado?: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
  };

  if (!id_trabajo || !id_metodo_pago || typeof monto !== 'number') {
    res.status(400).json({ error: 'Campos requeridos: id_trabajo, id_metodo_pago, monto' });
    return;
  }
  if (!(monto > 0)) {
    res.status(400).json({ error: 'El monto debe ser positivo' });
    return;
  }
  const st = estado ?? 'PAGADO';
  if (!['PAGADO', 'PENDIENTE', 'ANULADO'].includes(st)) {
    res.status(400).json({ error: 'Estado de pago inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const exists = await tableExists('PAGOS');
    if (!exists) {
      res.status(422).json({ error: 'La tabla PAGOS no existe. Ejecuta el script sql/setup_modulos.sql' });
      return;
    }

    const insert = await pool.request()
      .input('id_trabajo', sql.Int, id_trabajo)
      .input('id_metodo', sql.Int, id_metodo_pago)
      .input('monto', sql.Decimal(10, 2), monto)
      .input('estado', sql.VarChar(20), st)
      .query(`
        INSERT INTO PAGOS (ID_TRABAJO, ID_METODO_PAGO, MONTO, ESTADO)
        VALUES (@id_trabajo, @id_metodo, @monto, @estado);
        SELECT SCOPE_IDENTITY() AS id_pago;
      `);

    const id_pago = insert.recordset[0]?.id_pago ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'PAGOS',
      id_registro: id_pago ? Number(id_pago) : null,
      descripcion: 'Registrar pago',
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_pago, mensaje: 'Pago registrado' });
  } catch (err) {
    console.error('Error registrarPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

