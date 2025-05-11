#!/bin/bash
# Install dependencies
npm install --production=false

# Fix potential permission issues
npm rebuild

# Build the project
npm run build

# Clean up unnecessary files to reduce deployment size
rm -rf node_modules/@types
find node_modules -name "*.ts" -exec rm -rf {} \;
