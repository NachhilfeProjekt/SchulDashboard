#!/bin/bash
# Sicherstellen, dass TypeScript installiert ist
npm install -g typescript

# Abhängigkeiten installieren
npm install --production=false

# Build durchführen
npm run build

# Aufräumen
find node_modules -name "*.ts" -delete
rm -rf node_modules/.cache
