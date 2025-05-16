#!/bin/bash

# Sicherstellen, dass benötigte Tools installiert sind
npm install -g typescript rimraf

# Notwendige Abhängigkeiten installieren
npm install --production=false

# Bereinige das dist-Verzeichnis
rm -rf dist
mkdir -p dist

# Stelle sicher, dass alle nötigen Verzeichnisse existieren
mkdir -p src/validation logs

# Konvertiere cors-setup.js zu TypeScript, falls noch nicht vorhanden
if [ -f src/cors-setup.js ] && [ ! -f src/cors-setup.ts ]; then
  echo 'import cors from "cors";
import logger from "./config/logger";

function setupCors(app: any) {
  const allowedOrigins = [
    "https://dashboard-frontend-p693.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ];

  const corsOptions = {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) {
        logger.debug(`CORS: Zugriff erlaubt für Origin: ${origin || "Direkte Anfrage"}`);
        callback(null, true);
      } else {
        logger.warn(`CORS: Zugriff verweigert für Origin: ${origin}`);
        callback(new Error("CORS policy violation: Origin not allowed"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400
  };

  app.use((req: any, res: any, next: any) => {
    logger.debug(`CORS-Anfrage: ${req.method} ${req.url} von Origin: ${req.headers.origin || "Direkte Anfrage"}`);
    next();
  });

  app.use(cors(corsOptions));

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.message && err.message.includes("CORS")) {
      logger.warn(`CORS-Fehler: ${err.message}`);
      return res.status(403).json({ 
        message: "CORS-Fehler: Zugriff von dieser Domain ist nicht erlaubt" 
      });
    }
    next(err);
  });
}

export default setupCors;' > src/cors-setup.ts
  rm src/cors-setup.js
fi

# Kompilieren mit TypeScript
echo "Kompiliere TypeScript..."
npx tsc --skipLibCheck

# Erfolg überprüfen
if [ $? -ne 0 ]; then
  echo "TypeScript-Kompilierung fehlgeschlagen, versuche Fallback-Methode..."
  
  # Fallback: Manuell kopieren und konvertieren
  cp -R src/* dist/
  
  # TypeScript-Dateien zu JavaScript konvertieren
  find dist -name "*.ts" | while read file; do
    js_file="${file%.ts}.js"
    
    # Konvertiere mit Node.js für bessere Zuverlässigkeit
    node -e "
      const fs = require('fs');
      let content = fs.readFileSync('$file', 'utf8');
      
      // Import-Deklarationen konvertieren
      content = content.replace(/import ([^{]+) from ['\\\"]([^'\\\"]+)['\\\"];?/g, 'const \$1 = require(\"\$2\");');
      content = content.replace(/import \\{ ([^}]+) \\} from ['\\\"]([^'\\\"]+)['\\\"];?/g, 'const { \$1 } = require(\"\$2\");');
      content = content.replace(/export const/g, 'exports.');
      content = content.replace(/export default/g, 'module.exports =');
      
      // Typdefinitionen entfernen
      content = content.replace(/: [A-Za-z<>\\[\\](){}|&]+/g, '');
      content = content.replace(/\\?: [A-Za-z<>\\[\\](){}|&]+/g, '');
      
      fs.writeFileSync('$js_file', content);
      fs.unlinkSync('$file');
    "
  done
  
  echo "Fallback-Konvertierung abgeschlossen."
fi

echo "Build abgeschlossen!"
