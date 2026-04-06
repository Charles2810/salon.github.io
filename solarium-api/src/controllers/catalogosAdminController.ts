import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { logOperacion } from '../utils/bitacora';

function getActor(req: Request): number | null {
  return req.user?.id_usuario ?? null;
}

export async function listarCategoriasAdmin(req: Request, res: Response): Promise<void> {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  try {
    const pool = await getPool();
    const totalResult = await pool.request().query(`SELECT COUNT(1) AS total FROM CATEGORIAS`);
    const total = totalResult.recordset[0]?.total ?? 0;

    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .query(`
        SELECT ID_CATEGORIA AS id_categoria, NOMBRE AS nombre, DESCRIPCION AS descripcion, ESTADO AS estado
        FROM CATEGORIAS
        ORDER BY NOMBRE
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarCategoriasAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearCategoria(req: Request, res: Response): Promise<void> {
  const { nombre, descripcion } = req.body as { nombre?: string; descripcion?: string | null };
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), (descripcion ?? null) as any)
      .query(`
        INSERT INTO CATEGORIAS (NOMBRE, DESCRIPCION, ESTADO)
        VALUES (@nombre, @descripcion, 'ACTIVO');
        SELECT SCOPE_IDENTITY() AS id_categoria;
      `);

    const id_categoria = result.recordset[0]?.id_categoria ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'CATEGORIAS',
      id_registro: id_categoria ? Number(id_categoria) : null,
      descripcion: `Crear categoría: ${nombre.trim()}`,
      actor_id_usuario: getActor(req),
    });

    res.status(201).json({ id_categoria, mensaje: 'Categoría creada' });
  } catch (err) {
    console.error('Error crearCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function editarCategoria(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { nombre, descripcion, estado } = req.body as { nombre?: string; descripcion?: string | null; estado?: 'ACTIVO' | 'INACTIVO' };

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }
  if (estado && !['ACTIVO', 'INACTIVO'].includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), (descripcion ?? null) as any)
      .input('estado', sql.VarChar(10), (estado ?? 'ACTIVO') as any)
      .query(`
        UPDATE CATEGORIAS
        SET NOMBRE = @nombre,
            DESCRIPCION = @descripcion,
            ESTADO = @estado
        WHERE ID_CATEGORIA = @id
      `);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'CATEGORIAS',
      id_registro: id,
      descripcion: `Editar categoría: ${nombre.trim()}`,
      actor_id_usuario: getActor(req),
    });

    res.json({ mensaje: 'Categoría actualizada' });
  } catch (err) {
    console.error('Error editarCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarCategoria(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE CATEGORIAS SET ESTADO = 'INACTIVO' WHERE ID_CATEGORIA = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    await logOperacion({
      operacion: 'DELETE',
      tabla: 'CATEGORIAS',
      id_registro: id,
      descripcion: 'Desactivar categoría',
      actor_id_usuario: getActor(req),
    });

    res.json({ mensaje: 'Categoría desactivada' });
  } catch (err) {
    console.error('Error desactivarCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarServiciosAdmin(req: Request, res: Response): Promise<void> {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const id_categoria = req.query.id_categoria ? Number.parseInt(req.query.id_categoria as string, 10) : null;
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  try {
    const pool = await getPool();

    // Siempre declarar @id_categoria (aunque sea NULL) para evitar EREQUEST
    const totalResult = await pool.request()
      .input('id_categoria', sql.Int, id_categoria)
      .query(`
      SELECT COUNT(1) AS total
      FROM SERVICIOS
      WHERE (@id_categoria IS NULL OR ID_CATEGORIA = @id_categoria)
    `);
    const total = totalResult.recordset[0]?.total ?? 0;

    const dataReq = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .input('id_categoria', sql.Int, id_categoria);

    const result = await dataReq.query(`
      SELECT
        s.ID_SERVICIO AS id_servicio,
        s.NOMBRE AS nombre,
        s.DESCRIPCION AS descripcion,
        s.PRECIO AS precio,
        s.DURACION_MINUTOS AS duracion_minutos,
        s.ID_CATEGORIA AS id_categoria,
        c.NOMBRE AS categoria,
        s.ESTADO AS estado
      FROM SERVICIOS s
      JOIN CATEGORIAS c ON s.ID_CATEGORIA = c.ID_CATEGORIA
      WHERE (@id_categoria IS NULL OR s.ID_CATEGORIA = @id_categoria)
      ORDER BY s.NOMBRE
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarServiciosAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearServicio(req: Request, res: Response): Promise<void> {
  const { id_categoria, nombre, descripcion, precio, duracion_minutos } = req.body as {
    id_categoria?: number;
    nombre?: string;
    descripcion?: string | null;
    precio?: number;
    duracion_minutos?: number;
  };

  if (!id_categoria || !Number.isFinite(id_categoria)) {
    res.status(400).json({ error: 'La categoría es requerida' });
    return;
  }
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }
  if (typeof precio !== 'number' || !(precio > 0)) {
    res.status(400).json({ error: 'El precio debe ser positivo' });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_categoria', sql.Int, id_categoria)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), (descripcion ?? null) as any)
      .input('precio', sql.Decimal(10, 2), precio)
      .input('duracion', sql.Int, duracion_minutos ?? null)
      .query(`
        INSERT INTO SERVICIOS (ID_CATEGORIA, NOMBRE, DESCRIPCION, PRECIO, DURACION_MINUTOS, ESTADO)
        VALUES (@id_categoria, @nombre, @descripcion, @precio, @duracion, 'ACTIVO');
        SELECT SCOPE_IDENTITY() AS id_servicio;
      `);

    const id_servicio = result.recordset[0]?.id_servicio ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'SERVICIOS',
      id_registro: id_servicio ? Number(id_servicio) : null,
      descripcion: `Crear servicio: ${nombre.trim()}`,
      actor_id_usuario: getActor(req),
    });

    res.status(201).json({ id_servicio, mensaje: 'Servicio creado' });
  } catch (err) {
    console.error('Error crearServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function editarServicio(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { id_categoria, nombre, descripcion, precio, duracion_minutos, estado } = req.body as {
    id_categoria?: number;
    nombre?: string;
    descripcion?: string | null;
    precio?: number;
    duracion_minutos?: number;
    estado?: 'ACTIVO' | 'INACTIVO';
  };

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  if (!id_categoria || !Number.isFinite(id_categoria)) {
    res.status(400).json({ error: 'La categoría es requerida' });
    return;
  }
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }
  if (typeof precio !== 'number' || !(precio > 0)) {
    res.status(400).json({ error: 'El precio debe ser positivo' });
    return;
  }
  if (estado && !['ACTIVO', 'INACTIVO'].includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .input('id_categoria', sql.Int, id_categoria)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), (descripcion ?? null) as any)
      .input('precio', sql.Decimal(10, 2), precio)
      .input('duracion', sql.Int, duracion_minutos ?? null)
      .input('estado', sql.VarChar(10), (estado ?? 'ACTIVO') as any)
      .query(`
        UPDATE SERVICIOS
        SET ID_CATEGORIA = @id_categoria,
            NOMBRE = @nombre,
            DESCRIPCION = @descripcion,
            PRECIO = @precio,
            DURACION_MINUTOS = @duracion,
            ESTADO = @estado
        WHERE ID_SERVICIO = @id
      `);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'SERVICIOS',
      id_registro: id,
      descripcion: `Editar servicio: ${nombre.trim()}`,
      actor_id_usuario: getActor(req),
    });

    res.json({ mensaje: 'Servicio actualizado' });
  } catch (err) {
    console.error('Error editarServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarServicio(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE SERVICIOS SET ESTADO = 'INACTIVO' WHERE ID_SERVICIO = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'DELETE',
      tabla: 'SERVICIOS',
      id_registro: id,
      descripcion: 'Desactivar servicio',
      actor_id_usuario: getActor(req),
    });

    res.json({ mensaje: 'Servicio desactivado' });
  } catch (err) {
    console.error('Error desactivarServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

