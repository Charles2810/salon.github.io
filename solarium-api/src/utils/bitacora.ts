import sql from 'mssql';
import { getPool } from '../db/pool';
import { tableExists } from '../db/metadata';

export type BitacoraOperacion = 'INSERT' | 'UPDATE' | 'DELETE';

type LogParams = {
  operacion: BitacoraOperacion;
  tabla: string;
  id_registro?: number | null;
  descripcion?: string | null;
  actor_id_usuario?: number | null;
};

/**
 * Inserta un registro en BITACORA_OPERACIONES si la tabla existe.
 * Si no existe, no rompe el flujo (para facilitar instalación incremental).
 */
export async function logOperacion(params: LogParams): Promise<void> {
  try {
    const pool = await getPool();
    const exists = await tableExists('BITACORA_OPERACIONES');
    if (!exists) return;

    await pool.request()
      .input('operacion', sql.VarChar(10), params.operacion)
      .input('tabla', sql.VarChar(100), params.tabla)
      .input('id_registro', sql.Int, params.id_registro ?? null)
      .input('descripcion', sql.VarChar(255), params.descripcion ?? null)
      .input('actor_id_usuario', sql.Int, params.actor_id_usuario ?? null)
      .query(`
        INSERT INTO BITACORA_OPERACIONES (OPERACION, TABLA, ID_REGISTRO, DESCRIPCION, ACTOR_ID_USUARIO, FECHA)
        VALUES (@operacion, @tabla, @id_registro, @descripcion, @actor_id_usuario, GETDATE());
      `);
  } catch {
    // No bloquear la operación principal si falla la bitácora.
  }
}

