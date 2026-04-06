import { getPool } from './pool';
import sql from 'mssql';

export async function tableExists(tableName: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool.request()
    .input('name', sql.VarChar(128), tableName)
    .query(`
      SELECT 1 AS ok
      FROM sys.tables
      WHERE name = @name
    `);
  return result.recordset.length > 0;
}

export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool.request()
    .input('table', sql.VarChar(128), tableName)
    .input('col', sql.VarChar(128), columnName)
    .query(`
      SELECT 1 AS ok
      FROM sys.columns c
      JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = @table AND c.name = @col
    `);
  return result.recordset.length > 0;
}

