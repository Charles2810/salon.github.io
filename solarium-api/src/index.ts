import 'dotenv/config';
import app from './app';
import { getPool } from './db/pool';

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  try {
    await getPool();
    console.log('✅ Conexión a SQL Server establecida');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al conectar con SQL Server:', err);
    process.exit(1);
  }
}

main();
