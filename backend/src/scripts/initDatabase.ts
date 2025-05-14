// backend/src/scripts/initDatabase.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

// Lade Umgebungsvariablen
dotenv.config();

// Konfiguration aus Umgebungsvariablen
const dbConfig = {
  user: process.env.DB_USER || 'dashboard_db_cthh_user',
  host: process.env.DB_HOST || 'dpg-d0gbpv49c44c73fefpog-a.frankfurt-postgres.render.com',
  database: process.env.DB_NAME || 'dashboard_db_cthh',
  password: process.env.DB_PASSWORD || 'hWArsuzVNizlCilLT3sk35bzwqWbtaUT',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false }
};

async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    logger.info('Starte Datenbank-Initialisierung...');
    
    // SQL für die Tabellenerstellung
    const createTablesSql = `
      -- Benutzertabelle
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('developer', 'lead', 'office', 'teacher')),
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID,
        deactivated_by UUID,
        deactivated_at TIMESTAMP,
        temporary_token VARCHAR(255),
        temporary_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Tabellenstruktur für Standorte
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Beziehungstabelle für Benutzer und Standorte
      ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE users ADD CONSTRAINT fk_users_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE locations ADD CONSTRAINT fk_locations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

      -- Benutzer-Standort-Zuordnung
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id UUID NOT NULL,
        location_id UUID NOT NULL,
        PRIMARY KEY (user_id, location_id)
      );

      -- Custom Buttons
      CREATE TABLE IF NOT EXISTS custom_buttons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        location_id UUID NOT NULL,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Button-Berechtigungen
      CREATE TABLE IF NOT EXISTS button_permissions (
        button_id UUID NOT NULL,
        role VARCHAR(20) CHECK (role IN ('teacher', 'office', 'lead')),
        user_id UUID,
        CHECK ((role IS NOT NULL AND user_id IS NULL) OR (role IS NULL AND user_id IS NOT NULL))
      );

      -- E-Mail Vorlagen
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        location_id UUID NOT NULL,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Versandte E-Mails
      CREATE TABLE IF NOT EXISTS sent_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        template_id UUID,
        sender VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'resent')),
        location_id UUID NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // SQL für Foreign Keys und Constraints
    const foreignKeysSql = `
      -- Foreign Keys für Beziehungstabellen
      ALTER TABLE user_locations ADD CONSTRAINT fk_user_locations_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE user_locations ADD CONSTRAINT fk_user_locations_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;

      ALTER TABLE custom_buttons ADD CONSTRAINT fk_custom_buttons_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
      ALTER TABLE custom_buttons ADD CONSTRAINT fk_custom_buttons_created_by FOREIGN KEY (created_by) REFERENCES users(id);

      ALTER TABLE button_permissions ADD CONSTRAINT fk_button_permissions_button_id FOREIGN KEY (button_id) REFERENCES custom_buttons(id) ON DELETE CASCADE;
      ALTER TABLE button_permissions ADD CONSTRAINT fk_button_permissions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

      ALTER TABLE email_templates ADD CONSTRAINT fk_email_templates_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
      ALTER TABLE email_templates ADD CONSTRAINT fk_email_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id);

      ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_template_id FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
      ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
    `;

    // SQL für initiale Admin-Daten
    const initialDataSql = `
      -- Initialer Admin-Benutzer (Passwort: admin123)
      INSERT INTO users (id, email, password, role, is_active)
      VALUES (
        '11111111-1111-1111-1111-111111111111',
        'admin@example.com',
        '$2a$10$xJwL5vxZz4iRt.J9X6hC.eGWXGZ7nR2V/cZ7oJ3WzFxzC4sY8zQ1K',
        'developer',
        true
      ) ON CONFLICT (id) DO NOTHING;

      -- Initialer Standort
      INSERT INTO locations (id, name, created_by)
      VALUES (
        '22222222-2222-2222-2222-222222222222',
        'Hauptstandort',
        '11111111-1111-1111-1111-111111111111'
      ) ON CONFLICT (id) DO NOTHING;

      -- Zuordnung des Admins zum Hauptstandort
      INSERT INTO user_locations (user_id, location_id)
      VALUES (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
      ) ON CONFLICT (user_id, location_id) DO NOTHING;
    `;

    // Führe Tabellenerstellung aus
    logger.info('Erstelle Tabellen...');
    await pool.query(createTablesSql);
    logger.info('Tabellen erfolgreich erstellt.');

    // Versuche Foreign Keys zu erstellen (kann fehlschlagen, wenn bereits vorhanden)
    try {
      logger.info('Erstelle Foreign Keys...');
      await pool.query(foreignKeysSql);
      logger.info('Foreign Keys erfolgreich erstellt.');
    } catch (error) {
      logger.warn('Einige Foreign Keys konnten nicht erstellt werden (möglicherweise bereits vorhanden).');
    }

    // Füge initiale Daten ein
    logger.info('Füge initiale Daten ein...');
    await pool.query(initialDataSql);
    logger.info('Initiale Daten erfolgreich eingefügt.');

    logger.info('Datenbank-Initialisierung abgeschlossen!');
    return true;
  } catch (error) {
    logger.error(`Fehler bei der Datenbank-Initialisierung: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
    return false;
  } finally {
    await pool.end();
  }
}

// Starte die Initialisierung, wenn das Skript direkt ausgeführt wird
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(err => {
      logger.error(`Unerwarteter Fehler: ${err}`);
      process.exit(1);
    });
}

export default initializeDatabase;
