// backend/src/cors-setup.ts
import cors from 'cors';
import { Express } from 'express';
import logger from './config/logger';

function setupCors(app: Express): void {
  const allowedOrigins = [
    "https://dashboard-frontend-p693.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    // Ursprüngliche Frontend-URL auch erlauben, falls sie noch verwendet wird
    "https://dashboard-uweg.onrender.com",
    "https://dashboard-demo.onrender.com"
  ];
  
  logger.info('CORS konfiguriert für folgende Origins:', allowedOrigins);
  
  const corsOptions = {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Bei direkten API-Anfragen ist origin null
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        logger.debug(`CORS: Zugriff erlaubt für Origin: ${origin || 'Direkte Anfrage'}`);
        callback(null, true);
      } else {
        logger.warn(`CORS: Zugriff verweigert für Origin: ${origin}`);
        callback(new Error("CORS policy violation: Origin not allowed"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400 // 24 Stunden Cache für Pre-Flight-Anfragen
  };
  
  // CORS mit den definierten Optionen aktivieren
  app.use(cors(corsOptions));
  
  // Debug-Route zum Testen der CORS-Konfiguration
  app.options('*', cors(corsOptions));
  
  // Fehlerbehandlung für CORS
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.message && err.message.includes('CORS')) {
      logger.warn(`CORS-Fehler: ${err.message}`);
      return res.status(403).json({ 
        message: 'CORS-Fehler: Zugriff von dieser Domain ist nicht erlaubt' 
      });
    }
    next(err);
  });
}

export default setupCors;
