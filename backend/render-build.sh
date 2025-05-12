#!/bin/bash
# Prüfe ob im CI-Modus
if [ "$CI" = "true" ]; then
  npm ci --production=false
else
  npm install --production=false
fi

# Build mit Cache-Support
npm run build

# Bereinigung
find node_modules -name "*.ts" -delete
rm -rf node_modules/.cache
