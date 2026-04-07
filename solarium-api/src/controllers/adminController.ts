import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';

// ── Helpers ──────────────────────────────────────────────────────────────────
function paged(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize as string) || 10));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

// ── Reservas del día (tab Hoy) ────────────────────────────────────────────────
export async function listarReservasHoy(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        r.ID_RESERVA                           AS id_reserva,
        c.NOMBRE + ' ' + c.APELLIDO            AS cliente,
        s.NOMBRE                               AS servicio,
        u.NOMBRE + ' ' + u.APELLIDO            AS empleado,
        CONVERT(VARCHAR, r.FECHA_RESERVA, 23)  AS fecha_reserva,
        CONVERT(VARCHAR, r.HORA_RESERVA, 8)    AS hora_reserva,
        r.ESTADO                               AS estado,
        r.OBSERVACION                          AS observacion
      FROM RESERVAS r
      JOIN CLIENTES c  ON r.ID_CLIENTE  = c.ID_CLIENTE
      JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
      JOIN USUARIOS u  ON r.ID_USUARIO  = u.ID_USUARIO
      WHERE CAST(r.FECHA_RESERVA AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY r.HORA_RESERVA
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('listarReservasHoy:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── CATEGORIAS ────────────────────────────────────────────────────────────────
export async function listarCategorias(req: Request, res: Response): Promise<void> {
  const { page, pageSize, offset } = paged(req);
  try {
    const pool = await getPool();
    const [rows, cnt] = await Promise.all([
      pool.request().input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize).query(`
        SELECT ID_CATEGORIA AS id_categoria, NOMBRE AS nombre, DESCRIPCION AS descripcion, ESTADO AS estado
        FROM CATEGORIAS ORDER BY NOMBRE
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `),
      pool.request().query('SELECT COUNT(*) AS total FROM CATEGORIAS'),
    ]);
    res.json({ data: rows.recordset, page, pageSize, total: cnt.recordset[0].total });
  } catch (err) {
    console.error('listarCategorias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearCategoria(req: Request, res: Response): Promise<void> {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) { res.status(400).json({ error: 'El nombre es requerido' }); return; }
  try {
    const pool = await getPool();
    await pool.request()
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), descripcion?.trim() || null)
      .query(`INSERT INTO CATEGORIAS (NOMBRE, DESCRIPCION) VALUES (@nombre, @descripcion)`);
    res.status(201).json({ mensaje: 'Categoría creada' });
  } catch (err) {
    console.error('crearCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function actualizarCategoria(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const { nombre, descripcion, estado } = req.body;
  if (!nombre?.trim()) { res.status(400).json({ error: 'El nombre es requerido' }); return; }
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), descripcion?.trim() || null)
      .input('estado', sql.VarChar(20), estado || 'ACTIVO')
      .query(`UPDATE CATEGORIAS SET NOMBRE=@nombre, DESCRIPCION=@descripcion, ESTADO=@estado WHERE ID_CATEGORIA=@id`);
    res.json({ mensaje: 'Categoría actualizada' });
  } catch (err) {
    console.error('actualizarCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarCategoria(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id)
      .query(`UPDATE CATEGORIAS SET ESTADO='INACTIVO' WHERE ID_CATEGORIA=@id`);
    res.status(204).send();
  } catch (err) {
    console.error('desactivarCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── SERVICIOS ─────────────────────────────────────────────────────────────────
export async function listarServiciosAdmin(req: Request, res: Response): Promise<void> {
  const { page, pageSize, offset } = paged(req);
  try {
    const pool = await getPool();
    const [rows, cnt] = await Promise.all([
      pool.request().input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize).query(`
        SELECT s.ID_SERVICIO AS id_servicio, s.ID_CATEGORIA AS id_categoria,
               s.NOMBRE AS nombre, s.DESCRIPCION AS descripcion,
               s.PRECIO AS precio, s.DURACION_MINUTOS AS duracion_minutos,
               c.NOMBRE AS categoria, s.ESTADO AS estado
        FROM SERVICIOS s JOIN CATEGORIAS c ON s.ID_CATEGORIA=c.ID_CATEGORIA
        ORDER BY s.NOMBRE
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `),
      pool.request().query('SELECT COUNT(*) AS total FROM SERVICIOS'),
    ]);
    res.json({ data: rows.recordset, page, pageSize, total: cnt.recordset[0].total });
  } catch (err) {
    console.error('listarServiciosAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearServicio(req: Request, res: Response): Promise<void> {
  const { id_categoria, nombre, descripcion, precio, duracion_minutos } = req.body;
  if (!nombre?.trim() || !id_categoria || !precio) { res.status(400).json({ error: 'Campos requeridos faltantes' }); return; }
  try {
    const pool = await getPool();
    await pool.request()
      .input('id_categoria', sql.Int, id_categoria)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('descripcion', sql.VarChar(255), descripcion?.trim() || null)
      .input('precio', sql.Decimal(10, 2), precio)
      .input('duracion', sql.Int, duracion_minutos || null)
      .query(`INSERT INTO SERVICIOS (ID_CATEGORIA,NOMBRE,DESCRIPCION,PRECIO,DURACION_MINUTOS) VALUES (@id_categoria,@nombre,@descripcion,@precio,@duracion)`);
    res.status(201).json({ mensaje: 'Servicio creado' });
  } catch (err) {
    console.error('crearServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function actualizarServicio(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const { id_categoria, nombre, descripcion, precio, duracion_minutos, estado } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('id_categoria', sql.Int, id_categoria)
      .input('nombre', sql.VarChar(100), nombre?.trim())
      .input('descripcion', sql.VarChar(255), descripcion?.trim() || null)
      .input('precio', sql.Decimal(10, 2), precio)
      .input('duracion', sql.Int, duracion_minutos || null)
      .input('estado', sql.VarChar(20), estado || 'ACTIVO')
      .query(`UPDATE SERVICIOS SET ID_CATEGORIA=@id_categoria,NOMBRE=@nombre,DESCRIPCION=@descripcion,PRECIO=@precio,DURACION_MINUTOS=@duracion,ESTADO=@estado WHERE ID_SERVICIO=@id`);
    res.json({ mensaje: 'Servicio actualizado' });
  } catch (err) {
    console.error('actualizarServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function desactivarServicio(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id)
      .query(`UPDATE SERVICIOS SET ESTADO='INACTIVO' WHERE ID_SERVICIO=@id`);
    res.status(204).send();
  } catch (err) {
    console.error('desactivarServicio:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── CLIENTES ──────────────────────────────────────────────────────────────────
export async function listarClientesAdmin(req: Request, res: Response): Promise<void> {
  const { page, pageSize, offset } = paged(req);
  try {
    const pool = await getPool();
    const [rows, cnt] = await Promise.all([
      pool.request().input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize).query(`
        SELECT ID_CLIENTE AS id_cliente, NOMBRE AS nombre, APELLIDO AS apellido,
               TELEFONO AS telefono, CORREO AS correo
        FROM CLIENTES ORDER BY NOMBRE
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `),
      pool.request().query('SELECT COUNT(*) AS total FROM CLIENTES'),
    ]);
    res.json({ data: rows.recordset, page, pageSize, total: cnt.recordset[0].total });
  } catch (err) {
    console.error('listarClientesAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── USUARIOS ──────────────────────────────────────────────────────────────────
export async function listarUsuariosAdmin(req: Request, res: Response): Promise<void> {
  const { page, pageSize, offset } = paged(req);
  try {
    const pool = await getPool();
    const [rows, cnt] = await Promise.all([
      pool.request().input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize).query(`
        SELECT u.ID_USUARIO AS id_usuario, u.NOMBRE AS nombre, u.APELLIDO AS apellido,
               u.CORREO AS correo, u.USUARIO AS usuario, u.ESPECIALIDAD AS especialidad,
               u.ESTADO AS estado, u.ID_ROL AS id_rol, r.NOMBRE AS rol
        FROM USUARIOS u JOIN ROLES r ON u.ID_ROL=r.ID_ROL
        ORDER BY u.NOMBRE
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `),
      pool.request().query('SELECT COUNT(*) AS total FROM USUARIOS'),
    ]);
    res.json({ data: rows.recordset, page, pageSize, total: cnt.recordset[0].total });
  } catch (err) {
    console.error('listarUsuariosAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── RESERVAS ADMIN (con paginación y filtro fecha) ────────────────────────────
export async function listarReservasAdmin(req: Request, res: Response): Promise<void> {
  const { page, pageSize, offset } = paged(req);
  const { fecha_inicio, fecha_fin } = req.query as { fecha_inicio?: string; fecha_fin?: string };
  const fi = fecha_inicio || new Date().toISOString().slice(0, 10);
  const ff = fecha_fin || fi;
  try {
    const pool = await getPool();
    const [rows, cnt] = await Promise.all([
      pool.request()
        .input('fi', sql.Date, fi).input('ff', sql.Date, ff)
        .input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize)
        .query(`
          SELECT r.ID_RESERVA AS id_reserva, r.ID_CLIENTE AS id_cliente,
                 c.NOMBRE+' '+c.APELLIDO AS cliente,
                 r.ID_SERVICIO AS id_servicio, s.NOMBRE AS servicio,
                 r.ID_USUARIO AS id_usuario, u.NOMBRE+' '+u.APELLIDO AS usuario,
                 CONVERT(VARCHAR,r.FECHA_RESERVA,23) AS fecha_reserva,
                 CONVERT(VARCHAR,r.HORA_RESERVA,8) AS hora_reserva,
                 r.ESTADO AS estado, r.OBSERVACION AS observacion,
                 t.ID_TRABAJO AS id_trabajo, t.ESTADO AS estado_trabajo,
                 p.ID_PAGO AS id_pago, p.ESTADO AS estado_pago
          FROM RESERVAS r
          JOIN CLIENTES c  ON r.ID_CLIENTE=c.ID_CLIENTE
          JOIN SERVICIOS s ON r.ID_SERVICIO=s.ID_SERVICIO
          JOIN USUARIOS u  ON r.ID_USUARIO=u.ID_USUARIO
          LEFT JOIN TRABAJOS t ON t.ID_RESERVA=r.ID_RESERVA
          LEFT JOIN PAGOS p ON p.ID_TRABAJO=t.ID_TRABAJO
          WHERE r.FECHA_RESERVA BETWEEN @fi AND @ff
          ORDER BY r.FECHA_RESERVA, r.HORA_RESERVA
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `),
      pool.request().input('fi', sql.Date, fi).input('ff', sql.Date, ff)
        .query(`SELECT COUNT(*) AS total FROM RESERVAS WHERE FECHA_RESERVA BETWEEN @fi AND @ff`),
    ]);
    res.json({ data: rows.recordset, page, pageSize, total: cnt.recordset[0].total });
  } catch (err) {
    console.error('listarReservasAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crearReservaAdmin(req: Request, res: Response): Promise<void> {
  const { id_cliente, id_servicio, id_usuario, fecha_reserva, hora_reserva, observacion } = req.body;
  if (!id_cliente || !id_servicio || !id_usuario || !fecha_reserva || !hora_reserva) {
    res.status(400).json({ error: 'Campos requeridos faltantes' }); return;
  }
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('id_cliente', sql.Int, id_cliente)
      .input('id_servicio', sql.Int, id_servicio)
      .input('id_usuario', sql.Int, id_usuario)
      .input('fecha_reserva', sql.Date, fecha_reserva)
      .input('hora_reserva', sql.VarChar(8), hora_reserva)
      .input('observacion', sql.VarChar(255), observacion || null)
      .query(`
        INSERT INTO RESERVAS (ID_CLIENTE,ID_SERVICIO,ID_USUARIO,FECHA_RESERVA,HORA_RESERVA,ESTADO,OBSERVACION)
        VALUES (@id_cliente,@id_servicio,@id_usuario,@fecha_reserva,@hora_reserva,'PENDIENTE',@observacion);
        SELECT SCOPE_IDENTITY() AS id_reserva;
      `);
    res.status(201).json({ id_reserva: r.recordset[0].id_reserva, mensaje: 'Reserva creada' });
  } catch (err) {
    console.error('crearReservaAdmin:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function cancelarReserva(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id)
      .query(`UPDATE RESERVAS SET ESTADO='CANCELADO' WHERE ID_RESERVA=@id`);
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (err) {
    console.error('cancelarReserva:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── TRABAJOS ──────────────────────────────────────────────────────────────────
export async function crearTrabajo(req: Request, res: Response): Promise<void> {
  const { id_reserva, estado, notas } = req.body;
  if (!id_reserva) { res.status(400).json({ error: 'id_reserva es requerido' }); return; }
  try {
    const pool = await getPool();
    // Obtener datos de la reserva
    const reserva = await pool.request().input('id', sql.Int, id_reserva)
      .query(`SELECT ID_USUARIO, ID_SERVICIO FROM RESERVAS WHERE ID_RESERVA=@id`);
    if (reserva.recordset.length === 0) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
    const { ID_USUARIO, ID_SERVICIO } = reserva.recordset[0];
    const precio = await pool.request().input('id', sql.Int, ID_SERVICIO)
      .query(`SELECT PRECIO FROM SERVICIOS WHERE ID_SERVICIO=@id`);
    const r = await pool.request()
      .input('id_reserva', sql.Int, id_reserva)
      .input('id_usuario', sql.Int, ID_USUARIO)
      .input('id_servicio', sql.Int, ID_SERVICIO)
      .input('precio', sql.Decimal(10, 2), precio.recordset[0]?.PRECIO || 0)
      .input('estado', sql.VarChar(20), estado || 'COMPLETADO')
      .input('observacion', sql.VarChar(255), notas || null)
      .query(`
        INSERT INTO TRABAJOS (ID_RESERVA,ID_USUARIO,ID_SERVICIO,PRECIO_COBRADO,ESTADO,OBSERVACION)
        VALUES (@id_reserva,@id_usuario,@id_servicio,@precio,@estado,@observacion);
        SELECT SCOPE_IDENTITY() AS id_trabajo;
      `);
    res.status(201).json({ id_trabajo: r.recordset[0].id_trabajo, mensaje: 'Trabajo registrado' });
  } catch (err) {
    console.error('crearTrabajo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── PAGOS ─────────────────────────────────────────────────────────────────────
export async function crearPago(req: Request, res: Response): Promise<void> {
  const { id_trabajo, id_metodo_pago, monto, estado } = req.body;
  if (!id_trabajo || !monto) { res.status(400).json({ error: 'id_trabajo y monto son requeridos' }); return; }
  // Mapear id_metodo_pago a nombre de método
  const metodos: Record<number, string> = { 1: 'EFECTIVO', 2: 'QR', 3: 'TARJETA', 4: 'TRANSFERENCIA' };
  const metodo = metodos[id_metodo_pago] || 'EFECTIVO';
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('id_trabajo', sql.Int, id_trabajo)
      .input('monto', sql.Decimal(10, 2), monto)
      .input('metodo', sql.VarChar(30), metodo)
      .input('estado', sql.VarChar(20), estado || 'PAGADO')
      .query(`
        INSERT INTO PAGOS (ID_TRABAJO,MONTO,METODO_PAGO,ESTADO)
        VALUES (@id_trabajo,@monto,@metodo,@estado);
        SELECT SCOPE_IDENTITY() AS id_pago;
      `);
    res.status(201).json({ id_pago: r.recordset[0].id_pago, mensaje: 'Pago registrado' });
  } catch (err) {
    console.error('crearPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarMetodosPago(_req: Request, res: Response): Promise<void> {
  res.json([
    { id_metodo_pago: 1, nombre: 'EFECTIVO' },
    { id_metodo_pago: 2, nombre: 'QR' },
    { id_metodo_pago: 3, nombre: 'TARJETA' },
    { id_metodo_pago: 4, nombre: 'TRANSFERENCIA' },
  ]);
}

export async function listarStoredProcedures(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT
        ROUTINE_NAME AS nombre,
        ROUTINE_TYPE AS tipo,
        CONVERT(VARCHAR, CREATED, 120) AS creado,
        CONVERT(VARCHAR, LAST_ALTERED, 120) AS modificado
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME LIKE 'sp_%'
      ORDER BY ROUTINE_NAME
    `);
    res.json(r.recordset);
  } catch (err) {
    console.error('listarStoredProcedures:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── BITACORA ──────────────────────────────────────────────────────────────────
export async function bitacoraKpis(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT
        SUM(CASE WHEN ACCION='INSERT' THEN 1 ELSE 0 END) AS [insert],
        SUM(CASE WHEN ACCION='UPDATE' THEN 1 ELSE 0 END) AS [update],
        SUM(CASE WHEN ACCION='DELETE' THEN 1 ELSE 0 END) AS [delete]
      FROM BITACORA
      WHERE CAST(FECHA AS DATE) = CAST(GETDATE() AS DATE)
    `);
    const row = r.recordset[0];
    res.json({ insert: row.insert || 0, update: row.update || 0, delete: row.delete || 0 });
  } catch (err) {
    console.error('bitacoraKpis:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function bitacoraReciente(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT TOP 50
        ID_BITACORA AS id_bitacora,
        ACCION AS operacion,
        TABLA AS tabla,
        NULL AS id_registro,
        DESCRIPCION AS descripcion,
        NULL AS actor_id_usuario,
        CONVERT(VARCHAR, FECHA, 120) AS fecha
      FROM BITACORA
      ORDER BY FECHA DESC
    `);
    res.json(r.recordset);
  } catch (err) {
    console.error('bitacoraReciente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function bitacoraActividadDia(req: Request, res: Response): Promise<void> {
  const days = Math.min(30, parseInt(req.query.days as string) || 14);
  try {
    const pool = await getPool();
    const r = await pool.request().input('days', sql.Int, days).query(`
      SELECT CONVERT(VARCHAR, CAST(FECHA AS DATE), 23) AS dia, COUNT(*) AS total
      FROM BITACORA
      WHERE FECHA >= DATEADD(DAY, -@days, GETDATE())
      GROUP BY CAST(FECHA AS DATE)
      ORDER BY dia
    `);
    res.json(r.recordset);
  } catch (err) {
    console.error('bitacoraActividadDia:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ── REPORTES (captura mensajes PRINT del SP) ──────────────────────────────────
async function ejecutarReporte(spName: string, params: Record<string, { type: sql.ISqlTypeWithLength | sql.ISqlTypeWithPrecisionScale | sql.ISqlTypeWithScale | sql.ISqlTypeFactoryWithNoParams; value: unknown }>): Promise<string> {
  const pool = await getPool();
  const messages: string[] = [];

  // tedious emite PRINT via 'infoMessage' en cada conexión del pool
  // Necesitamos interceptar a nivel de la conexión tedious subyacente
  const tediousConnection = (pool as any).pool?._availableObjects?.[0]?.obj?.connection
    ?? (pool as any)._pool?._availableObjects?.[0]?.obj?.connection;

  const tediousHandler = (info: any) => {
    const msg = info?.message ?? info?.info?.message ?? '';
    if (msg) messages.push(msg);
  };

  if (tediousConnection) {
    tediousConnection.on('infoMessage', tediousHandler);
  }

  // También escuchar en el pool directamente
  const poolHandler = (info: any) => {
    const msg = info?.message ?? info?.info?.message ?? '';
    if (msg && !messages.includes(msg)) messages.push(msg);
  };
  pool.on('infoMessage', poolHandler);

  try {
    const req = pool.request();
    req.on('info', (info: any) => {
      const msg = info?.message ?? '';
      if (msg && !messages.includes(msg)) messages.push(msg);
    });

    for (const [name, { type, value }] of Object.entries(params)) {
      req.input(name, type, value);
    }
    await req.execute(spName);
  } finally {
    pool.removeListener('infoMessage', poolHandler);
    if (tediousConnection) {
      tediousConnection.removeListener('infoMessage', tediousHandler);
    }
  }

  if (messages.length > 0) return messages.join('\n');

  // Fallback: si no se capturaron mensajes PRINT, ejecutar con query directa
  // que retorna los datos como texto formateado
  return `(Sin salida PRINT — ejecuta el SP directamente en SSMS para ver el reporte)`;
}

export async function reporteReservas(req: Request, res: Response): Promise<void> {
  const { fecha_inicio, fecha_fin } = req.query as { fecha_inicio?: string; fecha_fin?: string };
  if (!fecha_inicio || !fecha_fin) {
    res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' }); return;
  }
  try {
    const texto = await ejecutarReporte('sp_ReporteReservas', {
      FECHA_INICIO: { type: sql.Date, value: fecha_inicio },
      FECHA_FIN:    { type: sql.Date, value: fecha_fin },
    });
    res.json({ reporte: texto });
  } catch (err) {
    console.error('reporteReservas:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}

export async function reporteUsuarios(req: Request, res: Response): Promise<void> {
  const id_rol = parseInt(req.query.id_rol as string) || 0;
  try {
    const texto = await ejecutarReporte('sp_ReporteUsuarios', {
      ID_ROL: { type: sql.Int, value: id_rol },
    });
    res.json({ reporte: texto });
  } catch (err) {
    console.error('reporteUsuarios:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}

export async function reportePagos(req: Request, res: Response): Promise<void> {
  const { fecha_inicio, fecha_fin } = req.query as { fecha_inicio?: string; fecha_fin?: string };
  if (!fecha_inicio || !fecha_fin) {
    res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' }); return;
  }
  try {
    const texto = await ejecutarReporte('sp_ReportePagos', {
      FECHA_INICIO: { type: sql.Date, value: fecha_inicio },
      FECHA_FIN:    { type: sql.Date, value: fecha_fin },
    });
    res.json({ reporte: texto });
  } catch (err) {
    console.error('reportePagos:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}

export async function reporteServicios(req: Request, res: Response): Promise<void> {
  const id_categoria = parseInt(req.query.id_categoria as string) || 0;
  try {
    const texto = await ejecutarReporte('sp_ReporteServicios', {
      ID_CATEGORIA: { type: sql.Int, value: id_categoria },
    });
    res.json({ reporte: texto });
  } catch (err) {
    console.error('reporteServicios:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}
