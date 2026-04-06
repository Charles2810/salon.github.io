import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';

export async function listarServicios(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        s.ID_SERVICIO      AS id_servicio,
        s.NOMBRE           AS nombre,
        s.DESCRIPCION      AS descripcion,
        s.PRECIO           AS precio,
        s.DURACION_MINUTOS AS duracion_minutos,
        c.NOMBRE           AS categoria
      FROM SERVICIOS s
      JOIN CATEGORIAS c ON s.ID_CATEGORIA = c.ID_CATEGORIA
      WHERE s.ESTADO = 'ACTIVO'
      ORDER BY s.NOMBRE
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarServicios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarPorCategoria(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID de categoría inválido' });
    return;
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_categoria', sql.Int, id)
      .query(`
        SELECT s.ID_SERVICIO, s.NOMBRE, s.DESCRIPCION, s.PRECIO, s.DURACION_MINUTOS AS duracion_minutos
        FROM SERVICIOS s
        WHERE s.ID_CATEGORIA = @id_categoria AND s.ESTADO = 'ACTIVO'
        ORDER BY s.NOMBRE
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarPorCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarCategorias(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ID_CATEGORIA AS id_categoria, NOMBRE AS nombre, DESCRIPCION AS descripcion
      FROM CATEGORIAS
      WHERE ESTADO = 'ACTIVO'
      ORDER BY NOMBRE
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarCategorias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
