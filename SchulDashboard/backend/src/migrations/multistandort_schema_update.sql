
-- Erweitern der user_locations Tabelle
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP DEFAULT NOW();
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

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
