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

// Lade Umgebungsvariablen aus .env-Datei
dotenv.config();

const app = express();

// CORS für alle Origins zulassen (für Entwicklung und Tests)
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sicherheitsheader 
// Helmet deaktivieren, da es zu CORS-Problemen führen kann
// app.use(helmet());

// Root-Route für schnelle Tests
app.get('/', (req, res) => {
  res.status(200).send('Dashboard Backend API is running');
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// API-Routen mit und ohne /api Präfix für maximale Kompatibilität
// Mit /api Präfix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Ohne /api Präfix für Kompatibilität
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/buttons', buttonRoutes);
app.use('/emails', emailRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Server starten
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Health check available at: http://localhost:${PORT}/health`);
  });
}

export default app;
