// Modifiziere in src/scripts/initDatabase.ts die SQL-Abfrage für die Tabellenerstellung
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
