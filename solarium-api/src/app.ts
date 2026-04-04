import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import serviciosRouter from './routes/servicios';
import empleadosRouter from './routes/empleados';
import clientesRouter from './routes/clientes';
import reservasRouter from './routes/reservas';

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

app.use('/api/v1', serviciosRouter);
app.use('/api/v1', empleadosRouter);
app.use('/api/v1', clientesRouter);
app.use('/api/v1', reservasRouter);

export default app;
