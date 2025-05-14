// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

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
  connectionTimeoutMillis: 2000, // wie lange auf eine Verbindung gewartet werden soll
};

// Erstellen eines Connection Pools
const pool = new Pool(dbConfig);

// Event-Handler für Pooling-Probleme
pool.on('error', (err: Error) => {
  logger.error(`Unexpected error on idle client: ${err.message}`);
});

// Teste die Datenbankverbindung beim Start
pool.query('SELECT NOW()')
  .then(() => logger.info('Datenbankverbindung erfolgreich hergestellt!'))
  .catch(err => logger.error(`Datenbankverbindungsfehler: ${err.message}`));

export default pool;
