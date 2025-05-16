// backend/src/cors-setup.js
const cors = require("cors");
const logger = require("./config/logger");

function setupCors(app) {
  const allowedOrigins = [
    "https://dashboard-frontend-p693.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    // Füge weitere Domains nach Bedarf hinzu
  ];
  
  logger.info('CORS konfiguriert für folgende Origins:', allowedOrigins);
  
  const corsOptions = {
    origin: function(origin, callback) {
      // Bei direkten API-Anfragen ist origin null
      if (!origin || allowedOrigins.includes(origin)) {
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
  
  // Protokollierung von CORS-Anfragen aktivieren
  app.use((req, res, next) => {
    logger.debug(`CORS-Anfrage: ${req.method} ${req.url} von Origin: ${req.headers.origin || 'Direkte Anfrage'}`);
    next();
  });
  
  // CORS mit den definierten Optionen aktivieren
  app.use(cors(corsOptions));
  
  // Fehlerbehandlung für CORS
  app.use((err, req, res, next) => {
    if (err.message.includes('CORS')) {
      logger.warn(`CORS-Fehler: ${err.message}`);
      return res.status(403).json({ 
        message: 'CORS-Fehler: Zugriff von dieser Domain ist nicht erlaubt' 
      });
    }
    next(err);
  });
}

module.exports = setupCors;
