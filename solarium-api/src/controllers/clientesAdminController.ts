import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { columnExists } from '../db/metadata';
import { logOperacion } from '../utils/bitacora';

function actor(req: Request): number | null {
  return req.user?.id_usuario ?? null;
}

export async function listarClientes(req: Request, res: Response): Promise<void> {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  try {
    const pool = await getPool();
    const hasEstado = await columnExists('CLIENTES', 'ESTADO');

    const totalReq = pool.request().input('q', sql.VarChar(200), q ? `%${q}%` : null);
    const totalResult = await totalReq.query(`
      SELECT COUNT(1) AS total
      FROM CLIENTES
      WHERE (@q IS NULL OR NOMBRE LIKE @q OR APELLIDO LIKE @q)
        ${hasEstado ? "AND ESTADO = 'ACTIVO'" : ''}
    `);
    const total = totalResult.recordset[0]?.total ?? 0;

    const dataReq = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .input('q', sql.VarChar(200), q ? `%${q}%` : null);

    const result = await dataReq.query(`
      SELECT
        ID_CLIENTE AS id_cliente,
        NOMBRE AS nombre,
        APELLIDO AS apellido,
        TELEFONO AS telefono,
        CORREO AS correo
        ${hasEstado ? ', ESTADO AS estado' : ''}
      FROM CLIENTES
      WHERE (@q IS NULL OR NOMBRE LIKE @q OR APELLIDO LIKE @q)
        ${hasEstado ? "AND ESTADO = 'ACTIVO'" : ''}
      ORDER BY NOMBRE
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarClientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearCliente(req: Request, res: Response): Promise<void> {
  const { nombre, apellido, telefono, correo } = req.body as {
    nombre?: string;
    apellido?: string;
    telefono?: string | null;
    correo?: string | null;
  };

  if (!nombre || !apellido || nombre.trim() === '' || apellido.trim() === '') {
    res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    return;
  }

  try {
    const pool = await getPool();
    const hasEstado = await columnExists('CLIENTES', 'ESTADO');

    const insert = await pool.request()
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('apellido', sql.VarChar(100), apellido.trim())
      .input('telefono', sql.VarChar(20), (telefono ?? null) as any)
      .input('correo', sql.VarChar(100), (correo ?? null) as any)
      .query(`
        INSERT INTO CLIENTES (NOMBRE, APELLIDO, TELEFONO, CORREO${hasEstado ? ', ESTADO' : ''})
        VALUES (@nombre, @apellido, @telefono, @correo${hasEstado ? ", 'ACTIVO'" : ''});
        SELECT SCOPE_IDENTITY() AS id_cliente;
      `);

    const id_cliente = insert.recordset[0]?.id_cliente ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'CLIENTES',
      id_registro: id_cliente ? Number(id_cliente) : null,
      descripcion: `Crear cliente: ${nombre.trim()} ${apellido.trim()}`,
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_cliente, mensaje: 'Cliente creado' });
  } catch (err) {
    console.error('Error crearCliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function editarCliente(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { nombre, apellido, telefono, correo } = req.body as {
    nombre?: string;
    apellido?: string;
    telefono?: string | null;
    correo?: string | null;
  };

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  if (!nombre || !apellido || nombre.trim() === '' || apellido.trim() === '') {
    res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('apellido', sql.VarChar(100), apellido.trim())
      .input('telefono', sql.VarChar(20), (telefono ?? null) as any)
      .input('correo', sql.VarChar(100), (correo ?? null) as any)
      .query(`
        UPDATE CLIENTES
        SET NOMBRE = @nombre,
            APELLIDO = @apellido,
            TELEFONO = @telefono,
            CORREO = @correo
        WHERE ID_CLIENTE = @id
      `);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'CLIENTES',
      id_registro: id,
      descripcion: `Editar cliente: ${nombre.trim()} ${apellido.trim()}`,
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Cliente actualizado' });
  } catch (err) {
    console.error('Error editarCliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function eliminarCliente(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const hasEstado = await columnExists('CLIENTES', 'ESTADO');

    const q = hasEstado
      ? `UPDATE CLIENTES SET ESTADO = 'INACTIVO' WHERE ID_CLIENTE = @id`
      : `DELETE FROM CLIENTES WHERE ID_CLIENTE = @id`;

    const result = await pool.request().input('id', sql.Int, id).query(q);

    if ((result.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'DELETE',
      tabla: 'CLIENTES',
      id_registro: id,
      descripcion: hasEstado ? 'Desactivar cliente' : 'Eliminar cliente',
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: hasEstado ? 'Cliente desactivado' : 'Cliente eliminado' });
  } catch (err) {
    console.error('Error eliminarCliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function historialCliente(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const pool = await getPool();

    const reservas = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          r.ID_RESERVA AS id_reserva,
          CONVERT(VARCHAR, r.FECHA_RESERVA, 23) AS fecha_reserva,
          CONVERT(VARCHAR, r.HORA_RESERVA, 8) AS hora_reserva,
          r.ESTADO AS estado,
          s.NOMBRE AS servicio,
          u.NOMBRE + ' ' + u.APELLIDO AS usuario
        FROM RESERVAS r
        JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
        JOIN USUARIOS u ON r.ID_USUARIO = u.ID_USUARIO
        WHERE r.ID_CLIENTE = @id
        ORDER BY r.FECHA_RESERVA DESC, r.HORA_RESERVA DESC
      `);

    const hasTrabajos = await columnExists('TRABAJOS', 'ID_TRABAJO');
    const hasTrabajosFecha = hasTrabajos ? await columnExists('TRABAJOS', 'FECHA') : false;
    const hasTrabajosNotas = hasTrabajos ? await columnExists('TRABAJOS', 'NOTAS') : false;
    let trabajos: any[] = [];
    if (hasTrabajos) {
      const trabajosResult = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT
            t.ID_TRABAJO AS id_trabajo,
            t.ESTADO AS estado_trabajo,
            ${hasTrabajosNotas ? 't.NOTAS' : 'NULL'} AS notas,
            ${hasTrabajosFecha ? "CONVERT(VARCHAR, t.FECHA, 23)" : "CONVERT(VARCHAR, GETDATE(), 23)"} AS fecha,
            r.ID_RESERVA AS id_reserva,
            s.NOMBRE AS servicio
          FROM TRABAJOS t
          JOIN RESERVAS r ON t.ID_RESERVA = r.ID_RESERVA
          JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
          WHERE r.ID_CLIENTE = @id
          ORDER BY ${hasTrabajosFecha ? 't.FECHA' : 't.ID_TRABAJO'} DESC
        `);
      trabajos = trabajosResult.recordset;
    }

    res.json({ reservas: reservas.recordset, trabajos });
  } catch (err) {
    console.error('Error historialCliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

