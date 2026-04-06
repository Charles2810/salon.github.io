import { Request, Response } from 'express';
import sql from 'mssql';
import { getPool } from '../db/pool';
import { tableExists } from '../db/metadata';

export async function kpisBitacora(_req: Request, res: Response): Promise<void> {
  try {
    const exists = await tableExists('BITACORA_OPERACIONES');
    if (!exists) {
      res.json({ insert: 0, update: 0, delete: 0 });
      return;
    }

    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        SUM(CASE WHEN OPERACION = 'INSERT' THEN 1 ELSE 0 END) AS total_insert,
        SUM(CASE WHEN OPERACION = 'UPDATE' THEN 1 ELSE 0 END) AS total_update,
        SUM(CASE WHEN OPERACION = 'DELETE' THEN 1 ELSE 0 END) AS total_delete
      FROM BITACORA_OPERACIONES
      WHERE CAST(FECHA AS DATE) = CAST(GETDATE() AS DATE)
    `);
    const row = result.recordset[0] ?? {};
    res.json({
      insert: Number(row.total_insert ?? 0),
      update: Number(row.total_update ?? 0),
      delete: Number(row.total_delete ?? 0),
    });
  } catch (err) {
    console.error('Error kpisBitacora:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function recienteBitacora(_req: Request, res: Response): Promise<void> {
  try {
    const exists = await tableExists('BITACORA_OPERACIONES');
    if (!exists) {
      res.json([]);
      return;
    }

    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 50
        ID_BITACORA AS id_bitacora,
        OPERACION AS operacion,
        TABLA AS tabla,
        ID_REGISTRO AS id_registro,
        DESCRIPCION AS descripcion,
        ACTOR_ID_USUARIO AS actor_id_usuario,
        CONVERT(VARCHAR, FECHA, 120) AS fecha
      FROM BITACORA_OPERACIONES
      ORDER BY FECHA DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error recienteBitacora:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function actividadPorDia(req: Request, res: Response): Promise<void> {
  const days = Number.parseInt((req.query.days as string) ?? '7', 10);
  const n = Math.min(Math.max(days, 7), 30);

  try {
    const exists = await tableExists('BITACORA_OPERACIONES');
    if (!exists) {
      res.json([]);
      return;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('n', sql.Int, n)
      .query(`
        SELECT
          CONVERT(VARCHAR, CAST(FECHA AS DATE), 23) AS dia,
          COUNT(1) AS total
        FROM BITACORA_OPERACIONES
        WHERE FECHA >= DATEADD(DAY, -@n, GETDATE())
        GROUP BY CAST(FECHA AS DATE)
        ORDER BY dia
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error actividadPorDia:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

