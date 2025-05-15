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
import { notFound, errorHandler } from './middleware/errorMiddleware';
import logger from './config/logger';
import debugRoutes from './routes/debugRoute';
import { initializeDatabase } from './scripts/initDatabase';

// Lade Umgebungsvariablen
dotenv.config();

const app = express();

// Debug-Routes (nur zur Fehlerbehebung, später entfernen)
app.use('/debug', debugRoutes);

// CORS-Konfiguration mit mehr Details
app.use(cors({
  origin: '*', // In Produktion sollten Sie spezifische Domains angeben
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Weitere Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root-Route für einfache Überprüfung
app.get('/', (req, res) => {
  res.status(200).send('Dashboard Backend API is running!');
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API-Routen
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/locations', locationRoutes);

// Alternative Routen ohne /api Präfix für maximale Kompatibilität
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/buttons', buttonRoutes);
app.use('/emails', emailRoutes);
app.use('/locations', locationRoutes);

// Datenbank-Initialisierungsroute - explizit außerhalb der initializeDatabase-Funktion
app.get('/init-database', async (req: express.Request, res: express.Response) => {
  try {
    const success = await initializeDatabase();
    if (success) {
      res.status(200).json({ 
        status: 'OK',
        message: 'Datenbank erfolgreich initialisiert'
      });
    } else {
      res.status(500).json({ 
        status: 'ERROR',
        message: 'Fehler bei der Datenbankinitialisierung'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: `Unerwarteter Fehler: ${error.message}`
    });
  }
});

// Fehlerbehandlung
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 10000;

// Server starten, wenn dies das Hauptmodul ist
if (require.main === module) {
  // Initialisiere die Datenbank, bevor der Server startet
  initializeDatabase()
    .then(success => {
      if (success) {
        logger.info('Datenbank erfolgreich initialisiert.');
      } else {
        logger.warn('Fehler bei der Datenbank-Initialisierung. Der Server wird trotzdem gestartet.');
      }
      // Starte den Server
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error(`Fehler beim Starten des Servers: ${err}`);
    });
}

export default app;
