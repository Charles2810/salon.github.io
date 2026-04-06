import sql from 'mssql';

function parseServerAndInstance(rawHost: string | undefined): { server: string; instanceName?: string } {
  const host = (rawHost ?? 'localhost').trim();
  // Accept formats:
  // - localhost
  // - localhost\SQLEXPRESS (common in SSMS)
  // - localhost\\SQLEXPRESS (in .env, because backslash escaping)
  const match = host.match(/^([^\\]+)\\+([^\\]+)$/);
  if (!match) return { server: host };
  return { server: match[1], instanceName: match[2] };
}

const { server, instanceName } = parseServerAndInstance(process.env.DB_HOST);

const parsedPort = process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : undefined;
const port = Number.isFinite(parsedPort) ? parsedPort : undefined;
// If a TCP port is provided, prefer it over instanceName (avoids SQL Browser dependency).
const effectiveInstanceName = port ? undefined : instanceName;

const config: sql.config = {
  server,
  ...(port ? { port } : {}),
  database: process.env.DB_NAME || 'DB_TiendaBelleza',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    ...(effectiveInstanceName ? { instanceName: effectiveInstanceName } : {}),
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
}
