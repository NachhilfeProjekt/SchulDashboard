#!/bin/bash
set -e

# Installiere notwendige Abhängigkeiten
echo "Installiere Abhängigkeiten für TypeScript-Direktausführung..."
npm install -g ts-node

# Stelle sicher, dass alle notwendigen Verzeichnisse existieren
mkdir -p logs

# Erstelle eine .env-Datei falls keine existiert
if [ ! -f .env ]; then
  echo "Keine .env-Datei gefunden, erstelle eine..."
  cat > .env << EOF
PORT=10000
NODE_ENV=production
DB_HOST=dpg-d0gbpv49c44c73fefpog-a.frankfurt-postgres.render.com
DB_NAME=dashboard_db_cthh
DB_USER=dashboard_db_cthh_user
DB_PASSWORD=hWArsuzVNizlCilLT3sk35bzwqWbtaUT
DB_PORT=5432
DB_SSL=true
JWT_SECRET=ein-sicherer-geheimer-schluessel-dashboard-system
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://dashboard-frontend-p693.onrender.com
EMAIL_FROM=no-reply@example.com
EOF
fi

# TypeScript-Version überprüfen
echo "TypeScript-Version:"
npx tsc --version

# TS-Node-Version überprüfen
echo "TS-Node-Version:"
npx ts-node --version

# Überprüfe TypeScript-Syntax ohne zu kompilieren
echo "Überprüfe TypeScript-Syntax..."
npx tsc --noEmit

echo "Setup für TypeScript-Direktausführung abgeschlossen!"
