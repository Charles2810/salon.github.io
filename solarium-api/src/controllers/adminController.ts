import { Request, Response } from 'express';
import { getPool } from '../db/pool';
import { ReservaAdmin } from '../types/index';

export async function listarReservasHoy(_req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const result = await pool.request().query<ReservaAdmin>(`
      SELECT
        r.ID_RESERVA                              AS id_reserva,
        c.NOMBRE + ' ' + c.APELLIDO              AS cliente,
        s.NOMBRE                                  AS servicio,
        u.NOMBRE + ' ' + u.APELLIDO              AS empleado,
        CONVERT(VARCHAR, r.FECHA_RESERVA, 23)    AS fecha_reserva,
        CONVERT(VARCHAR, r.HORA_RESERVA, 8)      AS hora_reserva,
        r.ESTADO                                  AS estado,
        r.OBSERVACION                             AS observacion
      FROM RESERVAS r
      JOIN CLIENTES c  ON r.ID_CLIENTE  = c.ID_CLIENTE
      JOIN SERVICIOS s ON r.ID_SERVICIO = s.ID_SERVICIO
      JOIN USUARIOS u  ON r.ID_USUARIO  = u.ID_USUARIO
      WHERE CAST(r.FECHA_RESERVA AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY r.HORA_RESERVA
    `);

    res.status(200).json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
