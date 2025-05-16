const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const buttonRoutes = require('./routes/buttonRoutes');
const emailRoutes = require('./routes/emailRoutes');
const dotenv = require('dotenv');
const pool = require('./config/database');
const logger = require('./config/logger');
const { initializeDatabase } = require('./scripts/initDatabase');

// Lade Umgebungsvariablen
dotenv.config();

// Importiere CORS-Setup
const setupCors = require('./cors-setup');

// Express-App initialisieren
const app = express();

// Standard-Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet()); // Sicherheitsheader
app.use(morgan('dev')); // Logging

// CORS konfigurieren
setupCors(app);

// Definieren Sie einen Basispfad für die API - Hier KEIN Basispfad verwenden
// Die Frontend-Anwendung erwartet API-Endpunkte unter /api/...
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Health-Check-Route direkt auf Root-Level
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root-Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running. Use /api/... endpoints to access resources.' });
});

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
  logger.info(`Umgebung: ${process.env.NODE_ENV}`);
});

module.exports = app;
