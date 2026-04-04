import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';

export async function listarServicios(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        s.id_servicio,
        s.nombre,
        s.descripcion,
        s.duracion_min,
        s.precio,
        c.nombre AS categoria
      FROM Servicio s
      JOIN Categoria c ON s.id_categoria = c.id_categoria
      WHERE s.activo = 1
      ORDER BY s.nombre
    `);
    res.json(result.recordset);
  } catch {
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
      .execute('sp_ListarServiciosPorCategoria');
    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarCategorias(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id_categoria, nombre, descripcion
      FROM Categoria
      WHERE activo = 1
      ORDER BY nombre
    `);
    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
