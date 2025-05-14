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

//
