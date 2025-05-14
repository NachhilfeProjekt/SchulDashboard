// backend/src/routes/authRoutes.ts
import express from 'express';
import { getUserByEmail, comparePasswords, getUserLocations, resetPassword, createUser } from '../models/User';
import { generateToken, sendPasswordResetEmail, sendTemporaryPasswordEmail } from '../services/authService';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validationMiddleware';
import Joi from 'joi';

// Definiere die Schemas direkt hier, falls der Import nicht funktioniert
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

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.' });
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.' });
    }

    const locations = await getUserLocations(user.id);
    const locationIds = locations.map(l => l.id);

    const token = generateToken(user.id, user.role, locationIds);

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
    console.error(`Login-Fehler: ${error}`);
    res.status(500).json({ message: 'Serverfehler bei der Anmeldung.' });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    await sendPasswordResetEmail(email);

    // Immer eine positive Antwort geben, um keine Informationen über existierende Konten preiszugeben
    res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.' });
  } catch (error) {
    console.error(`Fehler bei Passwort-Zurücksetzungsanfrage: ${error}`);
    res.status(500).json({ message: 'Fehler beim Anfordern des Passwort-Zurücksetzens.' });
  }
});

router.post('/reset-password', validate(passwordResetSchema), async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const success = await resetPassword(token, newPassword);

    if (success) {
      res.json({ message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.' });
    } else {
      res.status(400).json({ message: 'Ungültiger oder abgelaufener Token.' });
    }
  } catch (error) {
    console.error(`Fehler beim Zurücksetzen des Passworts: ${error}`);
    res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

// backend/src/routes/authRoutes.ts (Nur die create-user Route)

router.post('/create-user', validate(createUserSchema), async (req, res) => {
  try {
    const { email, role, locations } = req.body;
    const createdBy = req.user?.userId || '11111111-1111-1111-1111-111111111111'; // Default admin ID
    
    // Detaillierte Logs für bessere Fehlerbehebung
    console.log(`Erstelle Benutzer: email=${email}, role=${role}, locations=${JSON.stringify(locations)}, createdBy=${createdBy}`);
    
    // Prüfen, ob ein Benutzer mit dieser E-Mail bereits existiert
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        console.log(`E-Mail ${email} existiert bereits`);
        return res.status(400).json({ message: 'Ein Benutzer mit dieser E-Mail existiert bereits.' });
      }
    } catch (checkError) {
      console.error(`Fehler beim Prüfen der E-Mail-Existenz: ${checkError}`);
      return res.status(500).json({ message: 'Fehler beim Prüfen der Benutzerexistenz.' });
    }
    
    // Temporäres Passwort generieren
    const tempPassword = uuidv4().split('-')[0]; // Einfaches temporäres Passwort
    console.log(`Temporäres Passwort generiert für ${email}: [Passwort ausgeblendet für Sicherheit]`);
    
    try {
      const user = await createUser(email, tempPassword, role, locations, createdBy);
      console.log(`Benutzer ${email} erfolgreich erstellt mit ID: ${user.id}`);
      
      // Temporäres Passwort per E-Mail senden
      try {
        await sendTemporaryPasswordEmail(email, tempPassword);
        console.log(`Temporäres Passwort erfolgreich per E-Mail an ${email} gesendet`);
      } catch (emailError) {
        console.error(`Fehler beim Senden des temporären Passworts: ${emailError}`);
        // Wir geben trotzdem einen Erfolg zurück, warnen aber über das E-Mail-Problem
        return res.status(201).json({ 
          message: 'Benutzer erfolgreich erstellt, aber das temporäre Passwort konnte nicht per E-Mail versendet werden.',
          userId: user.id
        });
      }
      
      res.status(201).json({ 
        message: 'Benutzer erfolgreich erstellt. Ein temporäres Passwort wurde per E-Mail versendet.',
        userId: user.id
      });
    } catch (createError) {
      console.error(`Fehler beim Erstellen des Benutzers: ${createError}`);
      res.status(500).json({ message: `Fehler beim Erstellen des Benutzers: ${createError.message}` });
    }
  } catch (error) {
    console.error(`Hauptfehler beim Erstellen des Benutzers: ${error}`);
    res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers.' });
  }
});

export default router;
