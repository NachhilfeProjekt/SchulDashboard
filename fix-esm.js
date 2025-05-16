// fix-esm.js
const fs = require('fs');
const path = require('path');

// Der Pfad zum dist-Verzeichnis relativ zum aktuellen Skript
const distDir = path.join(__dirname, 'dist');

// Rekursiv durch alle Dateien in dist gehen
function processDirectory(directory) {
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Rekursiv Unterverzeichnisse verarbeiten
        processDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        // JS-Dateien verarbeiten
        fixESMIssue(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Fixen des ESM-Problems
function fixESMIssue(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fixen des Problematischen Patterns
    const originalContent = content;
    content = content.replace(
      /return \(mod && mod\.__esModule\) \? mod \{ "default" \};/g, 
      'return (mod && mod.__esModule) ? mod["default"] : mod;'
    );
    
    // Nur schreiben, wenn Änderungen vorgenommen wurden
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ESM issue in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Start der Verarbeitung
console.log('Starting ESM fix process...');
processDirectory(distDir);
console.log('ESM fix completed!');
