// backend/src/routes/authRoutes.ts
import express from 'express';
import { getUserByEmail, comparePasswords, getUserLocations, resetPassword, createUser } from '../models/User';
import { generateToken, sendPasswordResetEmail, sendTemporaryPasswordEmail } from '../services/authService';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validationMiddleware';
import { loginSchema, passwordResetSchema, createUserSchema } from '../validation/user';
import logger from '../config/logger';

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
        locations: locationIds
      }
    });
  } catch (error) {
    logger.error(`Login-Fehler: ${error}`);
    res.status(500).json({ message: 'Serverfehler bei der Anmeldung.' });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    const success = await sendPasswordResetEmail(email);

    // Immer eine positive Antwort geben, um keine Informationen über existierende Konten preiszugeben
    res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.' });
  } catch (error) {
    logger.error(`Fehler bei Passwort-Zurücksetzungsanfrage: ${error}`);
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
    logger.error(`Fehler beim Zurücksetzen des Passworts: ${error}`);
    res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

router.post('/create-user', validate(createUserSchema), async (req, res) => {
  try {
    const { email, role, locations, createdBy } = req.body;
    
    // Prüfen, ob ein Benutzer mit dieser E-Mail bereits existiert
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Ein Benutzer mit dieser E-Mail existiert bereits.' });
    }
    
    // Temporäres Passwort generieren
    const tempPassword = uuidv4().split('-')[0]; // Einfaches temporäres Passwort
    
    const user = await createUser(email, tempPassword, role, locations, createdBy);
    
    // Temporäres Passwort per E-Mail senden
    await sendTemporaryPasswordEmail(email, tempPassword);
    
    res.status(201).json({ 
      message: 'Benutzer erfolgreich erstellt. Ein temporäres Passwort wurde per E-Mail versendet.',
      userId: user.id
    });
  } catch (error) {
    logger.error(`Fehler beim Erstellen des Benutzers: ${error}`);
    res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers.' });
  }
});

export default router;
