// backend/src/scripts/initDatabase.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Lade Umgebungsvariablen
dotenv.config();

// Konfiguration aus Umgebungsvariablen
const dbConfig = {
  user: process.env.DB_USER || 'dashboard_db_cthh_user',
  host: process.env.DB_HOST || 'dpg-d0gbpv49c44c73fefpog-a.frankfurt-postgres.render.com',
  database: process.env.DB_NAME || 'dashboard_db_cthh',
  password: process.env.DB_PASSWORD || 'hWArsuzVNizlCilLT3sk35bzwqWbtaUT',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

export async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Starte Datenbank-Initialisierung...');
    
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

      -- Tabelle für Standorte
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Benutzer-Standort-Zuordnung
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
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
    `;

    // SQL für initiale Admin-Daten
    const initialDataSql = `
      -- Admin-Benutzer einfügen
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

    // Führe Tabellenerstellung aus
    console.log('Erstelle Tabellen...');
    await pool.query(createTablesSql);
    console.log('Tabellen erfolgreich erstellt.');

    // Füge initiale Daten ein
    console.log('Füge initiale Daten ein...');
    await pool.query(initialDataSql);
    console.log('Initiale Daten erfolgreich eingefügt.');

    // Überprüfen, ob Buttons vorhanden sind
    const buttonsResult = await pool.query('SELECT COUNT(*) FROM custom_buttons');
    console.log(`Anzahl der Buttons in der Datenbank: ${buttonsResult.rows[0].count}`);

    console.log('Datenbank-Initialisierung abgeschlossen!');
    return true;
  } catch (error) {
    console.error(`Fehler bei der Datenbank-Initialisierung: ${error.message}`);
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
        console.log('Initialisierung erfolgreich');
        process.exit(0);
      } else {
        console.error('Initialisierung fehlgeschlagen');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unerwarteter Fehler:', err);
      process.exit(1);
    });
  CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  details JSONB
);
}
