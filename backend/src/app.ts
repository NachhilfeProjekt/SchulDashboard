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

const app = express();

// CORS Konfiguration
const allowedOrigins = [
  'https://dashboard-frontend-p693.onrender.com',
  'http://localhost:3000',
  // Fügen Sie hier weitere Frontend-Domains hinzu
];

app.use(cors({
  origin: function(origin, callback) {
    // Erlaube Anfragen ohne Origin-Header (z.B. Mobile-Apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      logger.warn(`CORS blockiert für Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
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
  });
}

// Export für Tests
export default app;
