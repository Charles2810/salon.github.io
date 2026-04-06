import { Request, Response } from 'express';
import sql, { ConnectionPool } from 'mssql';
import { getPool } from '../db/pool';

export async function resolverCliente(
  pool: ConnectionPool,
  correo: string,
  nombre: string,
  apellido: string,
  telefono: string
): Promise<number> {
  // Buscar cliente existente por correo
  const busqueda = await pool.request()
    .input('correo', sql.VarChar(100), correo)
    .query('SELECT ID_CLIENTE FROM CLIENTES WHERE CORREO = @correo');

  if (busqueda.recordset.length > 0) {
    return busqueda.recordset[0].ID_CLIENTE as number;
  }

  // Insertar nuevo cliente
  const insercion = await pool.request()
    .input('nombre',   sql.VarChar(100), nombre)
    .input('apellido', sql.VarChar(100), apellido)
    .input('telefono', sql.VarChar(20),  telefono)
    .input('correo',   sql.VarChar(100), correo)
    .query(`
      INSERT INTO CLIENTES (NOMBRE, APELLIDO, TELEFONO, CORREO)
      VALUES (@nombre, @apellido, @telefono, @correo);
      SELECT SCOPE_IDENTITY() AS id_cliente;
    `);

  return insercion.recordset[0].id_cliente as number;
}

export async function buscarClientes(req: Request, res: Response): Promise<void> {
  const q = req.query.q as string | undefined;
  if (!q || q.trim() === '') {
    res.status(400).json({ error: "El parámetro 'q' es requerido" });
    return;
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('texto', sql.VarChar(100), `%${q.trim()}%`)
      .query(`
        SELECT ID_CLIENTE AS id_cliente, NOMBRE AS nombre, APELLIDO AS apellido,
               TELEFONO AS telefono, CORREO AS correo
        FROM CLIENTES
        WHERE NOMBRE LIKE @texto OR APELLIDO LIKE @texto
        ORDER BY NOMBRE
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error buscarClientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
