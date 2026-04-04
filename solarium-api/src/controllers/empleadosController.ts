import { Request, Response } from 'express';
import { getPool } from '../db/pool';

export async function listarEmpleados(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().execute('sp_ListarEmpleadosActivos');
    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
