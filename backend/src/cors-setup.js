const cors = require("cors");

function setupCors(app) {
  const allowedOrigins = [
    "https://dashboard-frontend-p693.onrender.com", 
    "http://localhost:5173", 
    "http://localhost:3000"
  ];
  
  console.log('CORS konfiguriert für folgende Origins:', allowedOrigins);
  
  const corsOptions = {
    origin: function(origin, callback) {
      console.log(`CORS check für Origin: ${origin || 'keine Origin (Browser-Anfrage)'}`);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS rejected origin: ${origin}`);
        callback(new Error("CORS policy violation: Origin not allowed"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400
  };
  
  app.use(cors(corsOptions));
}

module.exports = setupCors;
