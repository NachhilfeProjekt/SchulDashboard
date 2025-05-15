// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import locationRoutes from './routes/locationRoutes';
import buttonRoutes from './routes/buttonRoutes';
import emailRoutes from './routes/emailRoutes';
import debugRoute from './routes/debugRoute';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import logger from './config/logger';
import pool from './config/database';

// Lade Umgebungsvariablen
dotenv.config();

// Initialisiere Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/debug', debugRoute);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Starte Server
app.listen(PORT, () => {
  logger.info(`Server läuft auf Port ${PORT}`);
  logger.info(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
});

// Handle Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM Signal erhalten. Server wird heruntergefahren.');
  pool.end().then(() => {
    logger.info('Datenbankverbindungen geschlossen');
    process.exit(0);
  });
});

export default app;
