// backend/src/routes/userRoutes.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { createUserSchema, loginSchema, passwordResetSchema } from '../validation/user';
import { pool } from '../db/db';
import { sendPasswordResetEmail } from '../utils/emailService';

const router = express.Router();

// Hilfsfunktion, um Benutzerstandorte zu erhalten
const getUserLocations = async (userId: string) => {
  try {
    const result = await pool.query(
      `SELECT l.* FROM locations l 
       JOIN user_locations ul ON l.id = ul.location_id 
       WHERE ul.user_id = $1 AND l.is_active = true`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting user locations:', error);
    throw error;
  }
};

// Route zum Registrieren eines neuen Benutzers
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Überprüfen, ob Benutzer bereits existiert
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Benutzer mit dieser E-Mail existiert bereits' });
    }

    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Benutzer erstellen
    const userId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (id, email, password, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, email, hashedPassword, firstName, lastName, 'teacher', true]
    );

    const user = result.rows[0];

    // Standard-Standort zuweisen (falls implementiert)
    // ...

    // Token generieren
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        locations: [] // Standardmäßig keine Standorte
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server-Fehler bei der Registrierung' });
  }
});

// Route für die Benutzeranmeldung
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validierung der Eingaben mit Joi
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Benutzer in der Datenbank suchen
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const user = result.rows[0];

    // Überprüfen, ob Benutzer aktiv ist
    if (!user.is_active) {
      return res.status(401).json({ message: 'Benutzer ist deaktiviert' });
    }

    // Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Benutzerstandorte abrufen
    const locations = await getUserLocations(user.id);

    // Token generieren
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        locations
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server-Fehler bei der Anmeldung' });
  }
});

// Route zum Abrufen des aktuellen Benutzers
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    // Benutzer in der Datenbank suchen
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];
    
    // Benutzerstandorte abrufen
    const locations = await getUserLocations(user.id);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      locations
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen des Benutzers' });
  }
});

// Route zum Zurücksetzen des Passworts (Anfrage)
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Benutzer in der Datenbank suchen
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Aus Sicherheitsgründen keine Fehlermeldung zurückgeben
      return res.status(200).json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.' });
    }

    const user = result.rows[0];

    // Token für Passwort-Reset generieren
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token ist 1 Stunde gültig

    // Token in der Datenbank speichern
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // E-Mail zum Zurücksetzen des Passworts senden
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server-Fehler beim Zurücksetzen des Passworts' });
  }
});

// Route zum Zurücksetzen des Passworts (Bestätigung)
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validierung der Eingaben mit Joi
    const { error } = passwordResetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Benutzer mit diesem Token suchen
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Ungültiger oder abgelaufener Token' });
    }

    const user = result.rows[0];

    // Neues Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Passwort aktualisieren und Token zurücksetzen
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server-Fehler beim Zurücksetzen des Passworts' });
  }
});

// Route zum Abrufen der Benutzerstandorte
router.get('/locations/user', authMiddleware, async (req, res) => {
  try {
    const locations = await getUserLocations(req.user.id);
    res.json(locations);
  } catch (error) {
    console.error('Get user locations error:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Benutzerstandorte' });
  }
});

export default router;
