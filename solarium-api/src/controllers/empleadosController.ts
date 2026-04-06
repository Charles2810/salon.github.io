import { Request, Response } from 'express';
import { getPool } from '../db/pool';

export async function listarEmpleados(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        u.ID_USUARIO  AS id_empleado,
        u.NOMBRE      AS nombre,
        u.APELLIDO    AS apellido,
        u.ESPECIALIDAD AS especialidad,
        r.NOMBRE      AS rol
      FROM USUARIOS u
      JOIN ROLES r ON u.ID_ROL = r.ID_ROL
      WHERE u.ESTADO = 'ACTIVO'
        AND r.NOMBRE IN ('ESTILISTA', 'MANICURISTA', 'EMPLEADO')
      ORDER BY u.NOMBRE
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error listarEmpleados:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
