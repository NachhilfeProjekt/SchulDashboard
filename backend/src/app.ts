// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import locationRoutes from './routes/locationRoutes';
import buttonRoutes from './routes/buttonRoutes';
import emailRoutes from './routes/emailRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import logger from './config/logger';
import dotenv from 'dotenv';

// Lade Umgebungsvariablen aus .env-Datei
dotenv.config();

const app = express();

// CORS Konfiguration verbessert
const allowedOrigins = [
  'https://dashboard-frontend-p693.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',  // Vite standard port
];

app.use(cors({
  origin: function(origin, callback) {
    // Erlaube Anfragen ohne Origin-Header (z.B. Mobile-Apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Im Entwicklungsmodus oder von erlaubten Origins
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      logger.warn(`CORS blockiert für Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Wichtig für Cookies und Authentication-Header
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Deaktivieren für einfachere Entwicklung
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - WICHTIG: API-Prefix ist "/api"
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Gesundheitscheck-Route für Monitoring
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Füge allgemeine Route für Root-Zugriffe hinzu
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message: 'Dashboard Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Auch mit /api Präfix
app.get('/api', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message: 'Dashboard Backend API',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/users', '/api/locations', '/api/buttons', '/api/emails']
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Server nur starten, wenn dies das Hauptmodul ist
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Health check available at: http://localhost:${PORT}/health`);
  });
}

// Export für Tests
export default app;
