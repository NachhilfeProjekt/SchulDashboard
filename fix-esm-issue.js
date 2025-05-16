// fix-esm-issue.js
const fs = require('fs');
const path = require('path');

// Der Pfad zur app.js-Datei
const appJsPath = path.join(__dirname, 'backend', 'dist', 'app.js');

// Überprüfen, ob die Datei existiert
if (fs.existsSync(appJsPath)) {
  console.log('Fixing ESM issue in app.js...');
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Das Problem beheben
  content = content.replace(
    /return \(mod && mod\.__esModule\) \? mod \{ "default" \};/g,
    'return (mod && mod.__esModule) ? mod["default"] : mod;'
  );
  
  // Die korrigierte Datei speichern
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log('Fixed ESM issue in app.js');
} else {
  console.error('app.js not found at:', appJsPath);
}

// Rekursiv alle Dateien im dist-Verzeichnis prüfen und korrigieren
const distDir = path.join(__dirname, 'backend', 'dist');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Unterverzeichnisse rekursiv verarbeiten
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      // JavaScript-Dateien korrigieren
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Alle möglichen ESM-Import-Fehler beheben
      let modified = false;
      
      // Hauptproblem: Default-Export
      if (content.includes('return (mod && mod.__esModule) ? mod { "default" };')) {
        content = content.replace(
          /return \(mod && mod\.__esModule\) \? mod \{ "default" \};/g,
          'return (mod && mod.__esModule) ? mod["default"] : mod;'
        );
        modified = true;
      }
      
      // Andere mögliche Probleme mit Default-Exporten
      if (content.includes('__importDefault')) {
        content = content.replace(
          /__importDefault.*function.*return.*(mod.*__esModule).*mod.*"default".*mod.*/g,
          'function __importDefault(mod) { return (mod && mod.__esModule) ? mod["default"] : mod; }'
        );
        modified = true;
      }
      
      // Wenn Änderungen vorgenommen wurden, Datei speichern
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed ESM issue in:', filePath);
      }
    }
  });
}

try {
  console.log('Scanning all JavaScript files in dist directory...');
  processDirectory(distDir);
  console.log('ESM fixes completed successfully');
} catch (error) {
  console.error('Error while fixing ESM issues:', error);
}
