import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import locationRoutes from './routes/locationRoutes';
import buttonRoutes from './routes/buttonRoutes';
import emailRoutes from './routes/emailRoutes';
import dotenv from 'dotenv';
import pool from './config/database';
import logger from './config/logger';
import { initializeDatabase } from './scripts/initDatabase';

// Lade Umgebungsvariablen
dotenv.config();

// Express-App initialisieren
const app = express();

// Standard-Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet()); // Sicherheitsheader
app.use(morgan('dev')); // Logging

// CORS konfigurieren
// Importiere CORS-Setup
import setupCors from './cors-setup';
setupCors(app);

// Debugging-Middleware zum Loggen von Anfragen
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Root-Route für Basis-Healthcheck
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server running' });
});

// Health-Check-Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Debug-Routes
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
  app.get('/debug/env', (req, res) => {
    res.json({
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      apiUrl: process.env.API_URL,
      frontendUrl: process.env.FRONTEND_URL,
      debug: process.env.DEBUG,
      appMode: 'ES Modules',
    });
  });

  app.get('/debug/login-test', (req, res) => {
    res.json({
      message: 'Login test route active',
      loginTest: {
        email: 'admin@example.com',
        password: '[hidden]'
      }
    });
  });
}

// 404-Handler
app.use(notFound);

// Allgemeiner Fehlerhandler
app.use(errorHandler);

// Datenbank initialisieren, wenn INIT_DB Umgebungsvariable gesetzt ist
if (process.env.INIT_DB === 'true') {
  initializeDatabase()
    .then(success => {
      if (success) {
        logger.info('Database initialization complete');
      } else {
        logger.error('Database initialization failed');
      }
    })
    .catch(err => {
      logger.error(`Unexpected error during database initialization: ${err}`);
    });
}

// Server starten
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`Server läuft auf Port ${PORT}`);
  logger.info(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
