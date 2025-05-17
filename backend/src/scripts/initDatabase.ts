// backend/src/scripts/initDatabase.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Verbesserte Pool-Optionen für Render
  connectionTimeoutMillis: 15000, // 15 Sekunden Verbindungs-Timeout
  idleTimeoutMillis: 30000,       // 30 Sekunden Inaktivitäts-Timeout
  max: 10                         // Maximale Anzahl an Verbindungen
};

export async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    logger.info('Starte Datenbank-Initialisierung...');
    
    // SQL für die Tabellenerstellung mit Korrektur der Fremdschlüssel
    const createTablesSql = `
      -- Benutzertabelle (muss zuerst erstellt werden, da andere Tabellen darauf referenzieren)
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
      
      -- Tabelle für Standorte
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Nachdem beide Tabellen existieren, fügen wir die Fremdschlüssel hinzu
      DO $$
      BEGIN
        -- Fremdschlüssel für users.created_by
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        -- Fremdschlüssel für users.deactivated_by
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_deactivated_by_fkey'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_deactivated_by_fkey
          FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        -- Fremdschlüssel für locations.created_by
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'locations_created_by_fkey'
        ) THEN
          ALTER TABLE locations ADD CONSTRAINT locations_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
      
      -- Benutzer-Standort-Zuordnung
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        invited_at TIMESTAMP DEFAULT NOW(),
        activation_token VARCHAR(255),
        token_expires_at TIMESTAMP,
        PRIMARY KEY (user_id, location_id)
      );
      
      -- Custom Buttons
      CREATE TABLE IF NOT EXISTS custom_buttons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Button-Berechtigungen
      CREATE TABLE IF NOT EXISTS button_permissions (
        button_id UUID NOT NULL REFERENCES custom_buttons(id) ON DELETE CASCADE,
        role VARCHAR(20) CHECK (role IN ('teacher', 'office', 'lead')),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        CHECK ((role IS NOT NULL AND user_id IS NULL) OR (role IS NULL AND user_id IS NOT NULL))
      );
      
      -- E-Mail Vorlagen
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Versandte E-Mails
      CREATE TABLE IF NOT EXISTS sent_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        template_id UUID REFERENCES email_templates(id),
        sender VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'resent')),
        location_id UUID NOT NULL REFERENCES locations(id),
        sent_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Benutzeraktivitätsprotokoll
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        performed_at TIMESTAMP DEFAULT NOW(),
        details JSONB
      );
      
      -- Tabelle für Standort-Einladungen
      CREATE TABLE IF NOT EXISTS location_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        invited_by UUID NOT NULL REFERENCES users(id),
        role VARCHAR(20) NOT NULL CHECK (role IN ('lead', 'office', 'teacher')),
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Prüfen, ob der Admin-Benutzer bereits existiert
    const adminCheckQuery = `SELECT COUNT(*) FROM users WHERE email = 'admin@example.com'`;
    const adminCheck = await pool.query(adminCheckQuery);
    const adminExists = parseInt(adminCheck.rows[0].count) > 0;
    
    // SQL für initiale Admin-Daten
    let initialDataSql = '';
    
    if (!adminExists) {
      // Admin-Passwort für neuen Admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      initialDataSql = `
        -- Admin-Benutzer einfügen mit fester ID
        INSERT INTO users (id, email, password, role, is_active)
        VALUES (
          '11111111-1111-1111-1111-111111111111',
          'admin@example.com',
          '${hashedPassword}',
          'developer',
          true
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Initialer Standort mit fester ID
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
        
        -- Test-Button erstellen
        INSERT INTO custom_buttons (id, name, url, location_id, created_by)
        VALUES (
          '33333333-3333-3333-3333-333333333333',
          'Test-Button',
          'https://example.com',
          '22222222-2222-2222-2222-222222222222',
          '11111111-1111-1111-1111-111111111111'
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Button-Berechtigungen für alle Rollen
        INSERT INTO button_permissions (button_id, role)
        VALUES
          ('33333333-3333-3333-3333-333333333333', 'teacher'),
          ('33333333-3333-3333-3333-333333333333', 'office'),
          ('33333333-3333-3333-3333-333333333333', 'lead')
        ON CONFLICT DO NOTHING;
      `;
    }
    
    // Führe Tabellenerstellung aus
    logger.info('Erstelle Tabellen...');
    await pool.query(createTablesSql);
    logger.info('Tabellen erfolgreich erstellt.');
    
    // Füge initiale Daten ein, falls erforderlich
    if (initialDataSql) {
      logger.info('Füge initiale Daten ein...');
      await pool.query(initialDataSql);
      logger.info('Initiale Daten erfolgreich eingefügt.');
    }
    
    // Test-Button zum Standard-Standort hinzufügen (wenn noch keine Buttons existieren)
    const buttonsCount = await pool.query('SELECT COUNT(*) FROM custom_buttons WHERE location_id = $1', 
      ['22222222-2222-2222-2222-222222222222']);
    
    if (parseInt(buttonsCount.rows[0].count) === 0) {
      logger.info('Keine Buttons für Hauptstandort gefunden, erstelle Beispiel-Buttons...');
      
      await pool.query(`
        INSERT INTO custom_buttons (name, url, location_id, created_by)
        VALUES 
          ('Moodle', 'https://moodle.org', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
          ('Google Classroom', 'https://classroom.google.com', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
        RETURNING id
      `);
      
      logger.info('Beispiel-Buttons erfolgreich erstellt');
    }
    
    logger.info('Datenbank-Initialisierung abgeschlossen!');
    return true;
  } catch (error) {
    logger.error(`Fehler bei der Datenbank-Initialisierung: ${error.message}`);
    logger.error(error.stack);
    return false;
  } finally {
    await pool.end();
  }
}

// Wenn direkt aufgerufen
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        logger.info('Initialisierung erfolgreich');
        process.exit(0);
      } else {
        logger.error('Initialisierung fehlgeschlagen');
        process.exit(1);
      }
    })
    .catch(err => {
      logger.error('Unerwarteter Fehler:', err);
      process.exit(1);
    });
}
