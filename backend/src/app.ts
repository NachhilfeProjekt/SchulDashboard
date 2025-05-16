// backend/src/app.ts
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
import setupCors from './cors-setup';
import debugRoutes from './routes/debugRoute';

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

// Health-Check-Route für Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Datenbank-Verbindungstest-Endpunkt
app.get('/api/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    res.json({ 
      status: 'success', 
      message: 'Database connected', 
      time: result.rows[0].time,
      env: {
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
        dbPort: process.env.DB_PORT,
        useSSL: process.env.DB_SSL
      }
    });
  } catch (err) {
    logger.error(`Database connection test failed: ${err.message}`);
    res.status(500).json({ 
      status: 'error', 
      message: `Database connection failed: ${err.message}`,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// API-Tests-Endpunkt
app.get('/api/test', async (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    apiEndpoints: {
      auth: '/api/auth',
      users: '/api/users',
      locations: '/api/locations',
      buttons: '/api/buttons',
      emails: '/api/emails'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/debug', debugRoutes); // Debug-Routen hinzufügen

// Debug-Routes
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
  app.get('/debug/env', (req, res) => {
    res.json({
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      apiUrl: process.env.API_URL,
      frontendUrl: process.env.FRONTEND_URL,
      debug: process.env.DEBUG,
      appMode: 'TypeScript Direct Execution'
    });
  });
}

// 404-Handler
app.use(notFound);

// Allgemeiner Fehlerhandler
app.use(errorHandler);

// Datenbank initialisieren, entweder wenn INIT_DB=true oder wenn erste DB-Verbindung fehlschlägt
(async function checkAndInitDatabase() {
  try {
    // Versuche Verbindung zur Datenbank
    const client = await pool.connect();
    logger.info('Initial database connection successful');
    client.release();
    
    // Wenn INIT_DB gesetzt ist, initialisiere trotzdem
    if (process.env.INIT_DB === 'true') {
      logger.info('INIT_DB flag is set, initializing database...');
      await initializeDatabase();
    }
  } catch (err) {
    logger.error(`Initial database connection error: ${err.message}`);
    
    // Wenn die Verbindung fehlschlägt, versuche die Datenbank zu initialisieren
    logger.info('Attempting database initialization due to connection failure...');
    const success = await initializeDatabase();
    
    if (success) {
      logger.info('Database initialization successful after connection failure');
    } else {
      logger.error('Database initialization failed, application may not function correctly');
    }
  }
})();

// Server starten
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server läuft auf Port ${PORT}`);
  logger.info(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server läuft auf Port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

export default app;
