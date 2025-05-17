// backend/src/routes/authRoutes.ts
import express from 'express';
import { getUserByEmail, comparePasswords, getUserLocations, resetPassword, createUser, getUserById } from '../models/User';
import { generateToken, sendPasswordResetEmail, sendTemporaryPasswordEmail } from '../services/authService';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validationMiddleware';
import Joi from 'joi';
import pool from '../config/database';
import { authenticate } from '../middleware/authMiddleware';
import logger from '../config/logger';

// Schemas für die Validierung
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('developer', 'lead', 'office', 'teacher').required(),
  locations: Joi.array().items(Joi.string()).min(1).required()
});

const router = express.Router();

// Login-Route mit verbesserter Fehlerbehandlung
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    logger.info(`Login-Versuch für E-Mail: ${req.body.email}`);
    const { email, password } = req.body;

    // DEMO-MODUS: Für das Frontend-Testing immer erfolgreich anmelden
    if (process.env.DEMO_MODE === 'true') {
      logger.info(`DEMO-MODUS: Automatische Anmeldung für ${email}`);
      return res.json({
        token: "demo-token-1234567890",
        user: {
          id: "demo-user-id",
          email: email,
          role: "developer",
          locations: [{
            id: "22222222-2222-2222-2222-222222222222",
            name: "Hauptstandort"
          }]
        }
      });
    }

    // Benutzer suchen
    const user = await getUserByEmail(email);
    if (!user) {
      logger.warn(`Login fehlgeschlagen: Benutzer nicht gefunden für E-Mail: ${email}`);
      return res.status(401).json({ 
        message: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.' 
      });
    }

    // Passwort überprüfen
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      logger.warn(`Login fehlgeschlagen: Falsches Passwort für E-Mail: ${email}`);
      return res.status(401).json({ 
        message: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.' 
      });
    }

    // Standorte des Benutzers abrufen
    const locations = await getUserLocations(user.id);
    if (locations.length === 0) {
      logger.warn(`Login fehlgeschlagen: Benutzer ${email} hat keine Standorte zugewiesen`);
      return res.status(403).json({ 
        message: 'Benutzer hat keine Standorte zugewiesen. Bitte kontaktieren Sie den Administrator.' 
      });
    }

    const locationIds = locations.map(l => l.id);
    
    // Token generieren
    const token = generateToken(user.id, user.role, user.email, locationIds);

    
    logger.info(`Login erfolgreich für Benutzer: ${email}`);
    
    // Erfolgreiche Anmeldung protokollieren
    try {
      await pool.query(`
        INSERT INTO user_activity_log 
        (user_id, action, details) 
        VALUES ($1, $2, $3)
      `, [
        user.id, 
        'login', 
        JSON.stringify({ 
          timestamp: new Date().toISOString(),
          method: 'password'
        })
      ]);
    } catch (logError) {
      logger.error(`Fehler beim Protokollieren des Logins: ${logError}`);
      // Kein Problem, wenn die Protokollierung fehlschlägt
    }

    // Antwort senden
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        locations: locations
      }
    });
  } catch (error) {
    logger.error(`Login-Fehler: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({ message: 'Serverfehler bei der Anmeldung.' });
  }
});

// NEUER ENDPUNKT: Aktuellen Benutzer abrufen (/me)
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info(`Abrufen des aktuellen Benutzers mit ID: ${userId}`);
    
    // DEMO-MODUS: Demo-Daten zurückgeben
    if (process.env.DEMO_MODE === 'true') {
      return res.json({
        id: "demo-user-id",
        email: req.user.email || "demo@example.com",
        role: req.user.role || "developer",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`Benutzer mit ID ${userId} nicht gefunden`);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    // Benutzerdaten ohne sensible Informationen zurückgeben
    const { password, temporaryToken, temporaryTokenExpires, ...userData } = user;
    res.json(userData);
  } catch (error) {
    logger.error(`Fehler beim Abrufen des aktuellen Benutzers: ${error}`);
    res.status(500).json({ message: 'Fehler beim Abrufen des aktuellen Benutzers' });
  }
});

// Passwort-Zurücksetzung anfordern
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    logger.info(`Passwort-Zurücksetzung angefordert für E-Mail: ${email}`);
    
    await sendPasswordResetEmail(email);
    
    // Immer eine positive Antwort geben, um keine Informationen über existierende Konten preiszugeben
    res.json({ 
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.' 
    });
  } catch (error) {
    logger.error(`Fehler bei Passwort-Zurücksetzungsanfrage: ${error}`);
    res.status(500).json({ message: 'Fehler beim Anfordern des Passwort-Zurücksetzens.' });
  }
});

// Passwort zurücksetzen
router.post('/reset-password', validate(passwordResetSchema), async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    logger.info(`Passwort-Zurücksetzung mit Token wird versucht`);
    
    const success = await resetPassword(token, newPassword);
    
    if (success) {
      // Protokolliere die Passwortänderung
      try {
        const userResult = await pool.query(
          'SELECT id FROM users WHERE temporary_token = $1',
          [token]
        );
        
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Prüfe, ob die Tabelle user_activity_log existiert
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS user_activity_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                action VARCHAR(50) NOT NULL,
                performed_by UUID REFERENCES users(id),
                performed_at TIMESTAMP DEFAULT NOW(),
                details JSONB
              )`
            );
            
            await pool.query(
              'INSERT INTO user_activity_log (user_id, action, details) VALUES ($1, $2, $3)',
              [userId, 'password_reset', JSON.stringify({ method: 'reset_token' })]
            );
            
            logger.info(`Passwort-Zurücksetzung erfolgreich für Benutzer-ID: ${userId}`);
          } catch (logError) {
            logger.error('Error logging password reset:', logError);
          }
        }
      } catch (logError) {
        logger.error('Error logging password reset:', logError);
        // Fehler bei der Protokollierung sollten den Erfolg nicht beeinflussen
      }
      
      res.json({ message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.' });
    } else {
      logger.warn(`Passwort-Zurücksetzung fehlgeschlagen: Ungültiger oder abgelaufener Token`);
      res.status(400).json({ message: 'Ungültiger oder abgelaufener Token.' });
    }
  } catch (error) {
    logger.error(`Fehler beim Zurücksetzen des Passworts: ${error}`);
    res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

// Get current user and locations (für JWT validation)
router.get('/current-user', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    logger.debug(`Abrufen des aktuellen Benutzers: ${userId}`);
    
    // DEMO-MODUS: Demo-Daten zurückgeben
    if (process.env.DEMO_MODE === 'true') {
      return res.json({
        user: {
          id: "demo-user-id",
          email: req.user.email || "demo@example.com",
          role: req.user.role || "developer",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        locations: [{
          id: "22222222-2222-2222-2222-222222222222",
          name: "Hauptstandort"
        }]
      });
    }
    
    // Holen Sie Benutzer-Informationen
    const user = await getUserById(userId);
    if (!user) {
      logger.warn(`Benutzer nicht gefunden mit ID: ${userId}`);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    // Prüfen, ob der Benutzer aktiv ist
    if (!user.is_active) {
      logger.warn(`Zugriff verweigert: Benutzer ${userId} ist deaktiviert`);
      return res.status(403).json({ message: 'Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.' });
    }
    
    // Holen Sie Standorte des Benutzers
    const locations = await getUserLocations(userId);
    if (locations.length === 0 && user.role !== 'developer') {
      logger.warn(`Benutzer ${userId} hat keine Standorte zugewiesen`);
      return res.status(403).json({ message: 'Sie haben keine Standorte zugewiesen. Bitte kontaktieren Sie den Administrator.' });
    }
    
    // Benutzerdetails ohne sensitive Daten zurückgeben
  const userDetails = {
  id: user.id,
  email: user.email,
  role: user.role,
  is_active: user.is_active,
  created_at: user.createdAt, // Korrigiert von created_at zu createdAt
  updated_at: user.updatedAt  // Korrigiert von updated_at zu updatedAt
};
    
    res.json({
      user: userDetails,
      locations
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzerdaten' });
  }
});

export default router;
