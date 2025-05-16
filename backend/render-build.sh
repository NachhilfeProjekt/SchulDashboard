#!/bin/bash

# Bereinige das dist-Verzeichnis
rm -rf dist
mkdir -p dist

# Stelle sicher, dass alle nötigen Verzeichnisse existieren
mkdir -p logs

# Kopiere alle Dateien in den dist-Ordner
cp -R src/* dist/

# Konvertiere TypeScript-Dateien in JavaScript
echo "Konvertiere TypeScript zu JavaScript..."
find dist -name "*.ts" -type f | while read file; do
  js_file="${file%.ts}.js"
  
  echo "Konvertiere: $file zu $js_file"
  
  # Erstelle eine temporäre Datei
  temp_file=$(mktemp)
  
  # Schrittweise Transformation mit expliziten Patterns
  # 1. Import-Anweisungen konvertieren
  sed -E 's/import ([a-zA-Z0-9_]+) from ["'\''"]([^"'\''"]*)["'\''"]/const \1 = require("\2")/' "$file" > "$temp_file"
  
  # 2. Import mit geschwungenen Klammern konvertieren
  sed -E 's/import \{ ([^}]*) \} from ["'\''"]([^"'\''"]*)["'\''"]|")/const { \1 } = require("\2")/' "$temp_file" > "$js_file"
  
  # 3. Export-Anweisungen konvertieren
  sed -E -i 's/export default ([^;]*);?/module.exports = \1;/' "$js_file"
  sed -E -i 's/export const ([a-zA-Z0-9_]+)/exports.\1/' "$js_file"
  
  # 4. TypeScript-Typen entfernen (einfache Fälle)
  sed -E -i 's/: [a-zA-Z0-9_<>\[\]\(\)\{\}\|&]+//g' "$js_file"
  sed -E -i 's/\?: [a-zA-Z0-9_<>\[\]\(\)\{\}\|&]+//g' "$js_file"
  
  # Bereinige
  rm "$temp_file"
  rm "$file"
done

echo "Build abgeschlossen!"
