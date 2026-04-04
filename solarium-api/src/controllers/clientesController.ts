import { Request, Response } from 'express';
import sql from 'mssql';
import { ConnectionPool } from 'mssql';
import { getPool } from '../db/pool';

export async function resolverCliente(
  pool: ConnectionPool,
  email: string,
  nombre: string,
  apellido: string,
  telefono: string
): Promise<number> {
  // Buscar cliente existente por email
  const busqueda = await pool.request()
    .input('email', sql.VarChar(150), email)
    .query('SELECT id_cliente FROM Cliente WHERE email = @email');

  if (busqueda.recordset.length > 0) {
    return busqueda.recordset[0].id_cliente as number;
  }

  // Insertar nuevo cliente y retornar el ID generado
  const insercion = await pool.request()
    .input('nombre',   sql.VarChar(100), nombre)
    .input('apellido', sql.VarChar(100), apellido)
    .input('telefono', sql.VarChar(20),  telefono)
    .input('email',    sql.VarChar(150), email)
    .query(`
      INSERT INTO Cliente (nombre, apellido, telefono, email)
      VALUES (@nombre, @apellido, @telefono, @email);
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
      .input('texto', sql.VarChar(100), q.trim())
      .execute('sp_BuscarClientePorNombre');
    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
