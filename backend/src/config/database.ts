// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

// Stelle sicher, dass Umgebungsvariablen geladen sind
dotenv.config();

// Debug-Ausgabe der Datenbankverbindungsdaten (ohne Passwort)
logger.info(`Datenbank-Konfiguration: Host: ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}, User: ${process.env.DB_USER}, SSL: ${process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);

// Konfiguration aus Umgebungsvariablen
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Verbindungspooling-Optionen
  max: 20, // maximale Anzahl von Clients im Pool
  idleTimeoutMillis: 30000, // wie lange ein Client im Pool inaktiv bleiben kann bevor er freigegeben wird
  connectionTimeoutMillis: 10000, // wie lange auf eine Verbindung gewartet werden soll - erhöht für langsame Netzwerke
};

// Erstellen eines Connection Pools
const pool = new Pool(dbConfig);

// Event-Handler für Pooling-Probleme
pool.on('error', (err: Error) => {
  logger.error(`Unexpected error on idle client: ${err.message}`);
});

// Globaler Status für Datenbankverbindung
let dbStatus = {
  isConnected: false,
  lastConnectionAttempt: 0,
  connectionAttempts: 0
};

// Verbindungsmonitor
setInterval(async () => {
  // Nur versuchen, wenn nicht verbunden oder letzte Verbindung vor mehr als 60 Sekunden
  const now = Date.now();
  if (!dbStatus.isConnected || now - dbStatus.lastConnectionAttempt > 60000) {
    dbStatus.lastConnectionAttempt = now;
    
    try {
      const client = await pool.connect();
      if (!dbStatus.isConnected) {
        logger.info('Datenbankverbindung wiederhergestellt');
      }
      dbStatus.isConnected = true;
      dbStatus.connectionAttempts = 0;
      client.release();
    } catch (err) {
      dbStatus.isConnected = false;
      dbStatus.connectionAttempts++;
      logger.error(`Datenbankverbindungsfehler (Versuch ${dbStatus.connectionAttempts}): ${err.message}`);
    }
  }
}, 10000); // Alle 10 Sekunden prüfen

// Test der Datenbankverbindung
const testDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    logger.info('Datenbankverbindung erfolgreich hergestellt!');
    const result = await client.query('SELECT NOW() as now');
    logger.info(`Datenbankzeit: ${result.rows[0].now}`);
    return true;
  } catch (err: any) {
    logger.error(`Datenbankverbindungsfehler: ${err.message}`);
    
    // Spezifische Fehlermeldungen für häufige Probleme
    if (err.code === 'ENOTFOUND') {
      logger.error(`Der Hostname ${process.env.DB_HOST} konnte nicht aufgelöst werden. Überprüfen Sie die DB_HOST Umgebungsvariable.`);
    } else if (err.code === 'ECONNREFUSED') {
      logger.error(`Die Verbindung zu ${process.env.DB_HOST}:${process.env.DB_PORT} wurde abgelehnt. Überprüfen Sie Firewall und Netzwerkeinstellungen.`);
    } else if (err.code === '28P01') {
      logger.error('Authentifizierungsfehler: Falscher Benutzername oder Passwort.');
    } else if (err.code === '3D000') {
      logger.error(`Datenbank "${process.env.DB_NAME}" existiert nicht.`);
    }
    
    return false;
  } finally {
    if (client) client.release();
  }
};

// Sofortige Prüfung der Datenbankverbindung
testDatabase().then(success => {
  if (success) {
    logger.info('Datenbank ist bereit für Anfragen.');
  } else {
    logger.warn('Datenbank ist nicht verfügbar! Die Anwendung wird versuchen, sich später zu verbinden.');
  }
});

// Exportiere Pool und Status
export default pool;
export { dbStatus };
