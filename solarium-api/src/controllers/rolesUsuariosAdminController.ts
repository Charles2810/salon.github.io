import { Request, Response } from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool';
import { logOperacion } from '../utils/bitacora';

function actor(req: Request): number | null {
  return req.user?.id_usuario ?? null;
}

// ---------------- ROLES ----------------
export async function listarRoles(req: Request, res: Response): Promise<void> {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  try {
    const pool = await getPool();
    const totalResult = await pool.request().query(`SELECT COUNT(1) AS total FROM ROLES`);
    const total = totalResult.recordset[0]?.total ?? 0;

    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .query(`
        SELECT ID_ROL AS id_rol, NOMBRE AS nombre, ESTADO AS estado
        FROM ROLES
        ORDER BY NOMBRE
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarRoles:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearRol(req: Request, res: Response): Promise<void> {
  const { nombre } = req.body as { nombre?: string };
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre del rol es requerido' });
    return;
  }

  try {
    const pool = await getPool();
    const insert = await pool.request()
      .input('nombre', sql.VarChar(50), nombre.trim().toUpperCase())
      .query(`
        INSERT INTO ROLES (NOMBRE, ESTADO) VALUES (@nombre, 'ACTIVO');
        SELECT SCOPE_IDENTITY() AS id_rol;
      `);

    const id_rol = insert.recordset[0]?.id_rol ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'ROLES',
      id_registro: id_rol ? Number(id_rol) : null,
      descripcion: `Crear rol: ${nombre.trim().toUpperCase()}`,
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_rol, mensaje: 'Rol creado' });
  } catch (err) {
    console.error('Error crearRol:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function editarRol(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { nombre, estado } = req.body as { nombre?: string; estado?: 'ACTIVO' | 'INACTIVO' };

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  if (!nombre || nombre.trim() === '') {
    res.status(400).json({ error: 'El nombre del rol es requerido' });
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
      .input('nombre', sql.VarChar(50), nombre.trim().toUpperCase())
      .input('estado', sql.VarChar(10), (estado ?? 'ACTIVO') as any)
      .query(`
        UPDATE ROLES
        SET NOMBRE = @nombre, ESTADO = @estado
        WHERE ID_ROL = @id
      `);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'ROLES',
      id_registro: id,
      descripcion: `Editar rol: ${nombre.trim().toUpperCase()}`,
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Rol actualizado' });
  } catch (err) {
    console.error('Error editarRol:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarRol(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE ROLES SET ESTADO = 'INACTIVO' WHERE ID_ROL = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'DELETE',
      tabla: 'ROLES',
      id_registro: id,
      descripcion: 'Desactivar rol',
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Rol desactivado' });
  } catch (err) {
    console.error('Error desactivarRol:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ---------------- USUARIOS ----------------
export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  const page = Number.parseInt((req.query.page as string) ?? '1', 10);
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10);
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  const offset = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

  try {
    const pool = await getPool();

    const totalReq = pool.request().input('q', sql.VarChar(200), q ? `%${q}%` : null);
    const totalResult = await totalReq.query(`
      SELECT COUNT(1) AS total
      FROM USUARIOS u
      WHERE (@q IS NULL OR u.NOMBRE LIKE @q OR u.APELLIDO LIKE @q OR u.USUARIO LIKE @q OR u.CORREO LIKE @q)
    `);
    const total = totalResult.recordset[0]?.total ?? 0;

    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize)
      .input('q', sql.VarChar(200), q ? `%${q}%` : null)
      .query(`
        SELECT
          u.ID_USUARIO AS id_usuario,
          u.NOMBRE AS nombre,
          u.APELLIDO AS apellido,
          u.CORREO AS correo,
          u.USUARIO AS usuario,
          u.ESPECIALIDAD AS especialidad,
          u.ESTADO AS estado,
          r.ID_ROL AS id_rol,
          r.NOMBRE AS rol
        FROM USUARIOS u
        JOIN ROLES r ON u.ID_ROL = r.ID_ROL
        WHERE (@q IS NULL OR u.NOMBRE LIKE @q OR u.APELLIDO LIKE @q OR u.USUARIO LIKE @q OR u.CORREO LIKE @q)
        ORDER BY u.NOMBRE
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({ data: result.recordset, page, pageSize, total });
  } catch (err) {
    console.error('Error listarUsuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearUsuario(req: Request, res: Response): Promise<void> {
  const { nombre, apellido, correo, usuario, password, especialidad, id_rol } = req.body as {
    nombre?: string;
    apellido?: string;
    correo?: string;
    usuario?: string;
    password?: string;
    especialidad?: string | null;
    id_rol?: number;
  };

  if (!nombre || !apellido || !correo || !usuario || !password || !id_rol) {
    res.status(400).json({ error: 'Campos requeridos: nombre, apellido, correo, usuario, password, id_rol' });
    return;
  }

  try {
    const pool = await getPool();
    const hash = await bcrypt.hash(password, 10);

    const insert = await pool.request()
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('apellido', sql.VarChar(100), apellido.trim())
      .input('correo', sql.VarChar(100), correo.trim())
      .input('usuario', sql.VarChar(50), usuario.trim())
      .input('password', sql.VarChar(255), hash)
      .input('especialidad', sql.VarChar(100), (especialidad ?? null) as any)
      .input('id_rol', sql.Int, id_rol)
      .query(`
        INSERT INTO USUARIOS (NOMBRE, APELLIDO, CORREO, USUARIO, PASSWORD, ESPECIALIDAD, ID_ROL, ESTADO)
        VALUES (@nombre, @apellido, @correo, @usuario, @password, @especialidad, @id_rol, 'ACTIVO');
        SELECT SCOPE_IDENTITY() AS id_usuario;
      `);

    const id_usuario = insert.recordset[0]?.id_usuario ?? null;
    await logOperacion({
      operacion: 'INSERT',
      tabla: 'USUARIOS',
      id_registro: id_usuario ? Number(id_usuario) : null,
      descripcion: `Crear usuario: ${usuario.trim()}`,
      actor_id_usuario: actor(req),
    });

    res.status(201).json({ id_usuario, mensaje: 'Usuario creado' });
  } catch (err) {
    console.error('Error crearUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function editarUsuario(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { nombre, apellido, correo, usuario, especialidad } = req.body as {
    nombre?: string;
    apellido?: string;
    correo?: string;
    usuario?: string;
    especialidad?: string | null;
  };

  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  if (!nombre || !apellido || !correo || !usuario) {
    res.status(400).json({ error: 'Campos requeridos: nombre, apellido, correo, usuario' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('apellido', sql.VarChar(100), apellido.trim())
      .input('correo', sql.VarChar(100), correo.trim())
      .input('usuario', sql.VarChar(50), usuario.trim())
      .input('especialidad', sql.VarChar(100), (especialidad ?? null) as any)
      .query(`
        UPDATE USUARIOS
        SET NOMBRE = @nombre,
            APELLIDO = @apellido,
            CORREO = @correo,
            USUARIO = @usuario,
            ESPECIALIDAD = @especialidad
        WHERE ID_USUARIO = @id
      `);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'USUARIOS',
      id_registro: id,
      descripcion: `Editar usuario: ${usuario.trim()}`,
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Usuario actualizado' });
  } catch (err) {
    console.error('Error editarUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function cambiarRolUsuario(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const { id_rol } = req.body as { id_rol?: number };

  if (!Number.isFinite(id) || !id_rol || !Number.isFinite(id_rol)) {
    res.status(400).json({ error: 'ID usuario e id_rol son requeridos' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .input('id_rol', sql.Int, id_rol)
      .query(`UPDATE USUARIOS SET ID_ROL = @id_rol WHERE ID_USUARIO = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'UPDATE',
      tabla: 'USUARIOS',
      id_registro: id,
      descripcion: 'Cambiar rol de usuario',
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Rol actualizado' });
  } catch (err) {
    console.error('Error cambiarRolUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarUsuario(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const pool = await getPool();
    const update = await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE USUARIOS SET ESTADO = 'INACTIVO' WHERE ID_USUARIO = @id`);

    if ((update.rowsAffected[0] ?? 0) === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await logOperacion({
      operacion: 'DELETE',
      tabla: 'USUARIOS',
      id_registro: id,
      descripcion: 'Desactivar usuario',
      actor_id_usuario: actor(req),
    });

    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) {
    console.error('Error desactivarUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

