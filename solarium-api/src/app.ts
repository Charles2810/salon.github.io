import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import serviciosRouter from './routes/servicios';
import empleadosRouter from './routes/empleados';
import clientesRouter from './routes/clientes';
import reservasRouter from './routes/reservas';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import catalogosAdminRouter from './routes/catalogosAdmin';
import clientesAdminRouter from './routes/clientesAdmin';
import rolesUsuariosAdminRouter from './routes/rolesUsuariosAdmin';
import reservasTrabajosPagosAdminRouter from './routes/reservasTrabajosPagosAdmin';
import bitacoraAdminRouter from './routes/bitacoraAdmin';

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

app.use('/api/v1', serviciosRouter);
app.use('/api/v1', empleadosRouter);
app.use('/api/v1', clientesRouter);
app.use('/api/v1', reservasRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin', catalogosAdminRouter);
app.use('/api/v1/admin', clientesAdminRouter);
app.use('/api/v1/admin', rolesUsuariosAdminRouter);
app.use('/api/v1/admin', reservasTrabajosPagosAdminRouter);
app.use('/api/v1/admin', bitacoraAdminRouter);

export default app;
