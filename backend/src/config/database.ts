// backend/src/config/database.ts
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

// Stelle sicher, dass Umgebungsvariablen geladen sind
dotenv.config();

// Debug-Ausgabe der Datenbankverbindungsdaten (ohne Passwort)
logger.info(`Datenbank-Konfiguration: Host: ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}, User: ${process.env.DB_USER}, SSL: ${process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);

// Konfiguration aus Umgebungsvariablen
const dbConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Verbindungspooling-Optionen - angepasst für Render Free-Tier
  max: 10,                        // Reduziert für Free-Tier
  idleTimeoutMillis: 30000,       // 30 Sekunden inaktiv
  connectionTimeoutMillis: 15000, // 15 Sekunden Verbindungs-Timeout
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
      // Keep-Alive-Query ausführen
      await client.query('SELECT 1');
      if (!dbStatus.isConnected) {
        logger.info('Datenbankverbindung wiederhergestellt');
      }
      dbStatus.isConnected = true;
      dbStatus.connectionAttempts = 0;
      client.release();
    } catch (err) {
      dbStatus.isConnected = false;
      dbStatus.connectionAttempts++;
      
      // Nur alle 5 Versuche loggen, um Log-Spam zu vermeiden
      if (dbStatus.connectionAttempts % 5 === 1) {
        logger.error(`Datenbankverbindungsfehler (Versuch ${dbStatus.connectionAttempts}): ${err.message}`);
      }
      
      // Bei anhaltenden Verbindungsproblemen Demo-Modus aktivieren
      if (dbStatus.connectionAttempts > 10 && process.env.DEMO_MODE !== 'true') {
        process.env.DEMO_MODE = 'true';
        logger.warn('DEMO_MODE automatisch aktiviert nach 10 fehlgeschlagenen DB-Verbindungsversuchen');
      }
    }
  }
}, 50000); // Alle 50 Sekunden prüfen (unter der 60-Sekunden-Inaktivitätsschwelle von Render)

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
    
    // Demo-Modus aktivieren bei Datenbankfehlern
    process.env.DEMO_MODE = 'true';
    logger.warn('DEMO_MODE aktiviert aufgrund von Datenbankverbindungsproblemen');
    
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
    logger.warn('Datenbank ist nicht verfügbar! Die Anwendung wechselt in den Demo-Modus.');
  }
});

// Exportiere Pool und Status
export default pool;
export { dbStatus };
