import express from 'express';
import { User } from '../models/User';
import { generateToken } from '../services/authService';
import { sendPasswordResetEmail, sendTemporaryPasswordEmail } from '../services/authService';
import { createUser, getUserByEmail, comparePasswords, getUserLocations, resetPassword } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/login', async (req, res) => {
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Serverfehler bei der Anmeldung.' });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    const success = await sendPasswordResetEmail(email);

    if (success) {
      res.json({ message: 'Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde gesendet, falls die E-Mail registriert ist.' });
    } else {
      res.status(404).json({ message: 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.' });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Fehler beim Anfordern des Passwort-Zurücksetzens.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const success = await resetPassword(token, newPassword);

    if (success) {
      res.json({ message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.' });
    } else {
      res.status(400).json({ message: 'Ungültiger oder abgelaufener Token.' });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

router.post('/create-user', async (req, res) => {
  try {
    const { email, role, locations, createdBy } = req.body;
    
    // Generate temporary password
    const tempPassword = uuidv4().split('-')[0]; // Simple temporary password
    
    const user = await createUser(email, tempPassword, role, locations, createdBy);
    
    // Send temporary password email
    await sendTemporaryPasswordEmail(email, tempPassword);
    
    res.status(201).json({ 
      message: 'Benutzer erfolgreich erstellt. Ein temporäres Passwort wurde per E-Mail versendet.',
      userId: user.id
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers.' });
  }
});

export default router;