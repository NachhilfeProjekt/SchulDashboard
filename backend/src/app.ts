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

// DEMO-MODUS aktivieren, wenn kein DB-Zugriff möglich ist
process.env.DEMO_MODE = process.env.DEMO_MODE || 'true';
logger.info(`DEMO_MODE ist ${process.env.DEMO_MODE === 'true' ? 'AKTIVIERT' : 'DEAKTIVIERT'}`);

// Express-App initialisieren
const app = express();

// Standard-Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet()); // Sicherheitsheader
app.use(morgan('dev')); // Logging

// CORS konfigurieren - erlaube alle Origins im Entwicklungsmodus
if (process.env.NODE_ENV !== 'production') {
  app.use(cors()); // Im Entwicklungsmodus alle Origins erlauben
  logger.info('CORS: Alle Origins erlaubt (Entwicklungsmodus)');
} else {
  setupCors(app); // Ansonsten normale CORS-Konfiguration verwenden
}

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

// Ping-Endpoint für Frontend-Verbindungsprüfung
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is reachable'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Debug-Routes nur in nicht-Produktivumgebungen oder explizit aktiviert
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
  app.use('/api/debug', debugRoutes);
  logger.info('Debug-Routen aktiviert');
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
      
      // Aktiviere den DEMO_MODE wenn die Datenbankinitialisierung fehlschlägt
      process.env.DEMO_MODE = 'true';
      logger.warn('DEMO_MODE automatically activated due to database initialization failure');
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
