// Erweiterte locationRoutes.ts für Standort-Einladungen

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getLocations, createLocation, getUserLocations, getLocationById, deleteLocation } from '../models/User';
import pool from '../config/database';
import { sendEmail } from '../services/emailService';
import bcrypt from 'bcryptjs';

const router = express.Router();
router.use(authenticate);

// Bestehende Routen beibehalten...

// Benutzer zu einem Standort einladen (nur für Leitungen und Entwickler)
router.post('/invite', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { email, locationId, role } = req.body;
    
    // Prüfen, ob die Location existiert
    const location = await getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Standort nicht gefunden.' });
    }
    
    // Prüfen, ob der aktuelle Benutzer Zugriff auf diesen Standort hat
    if (req.user.role !== 'developer') {
      const userLocations = await getUserLocations(req.user.userId);
      const hasAccess = userLocations.some(loc => loc.id === locationId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort.' });
      }
    }
    
    // Unique Token für die Einladung generieren
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 48); // 48 Stunden gültig
    
    // Prüfen, ob der Benutzer bereits existiert
    const existingUserQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    let userId = null;
    if (existingUserQuery.rows.length > 0) {
      userId = existingUserQuery.rows[0].id;
      
      // Prüfen, ob der Benutzer bereits mit diesem Standort verknüpft ist
      const existingRelationQuery = await pool.query(
        'SELECT * FROM user_locations WHERE user_id = $1 AND location_id = $2',
        [userId, locationId]
      );
      
      if (existingRelationQuery.rows.length > 0) {
        // Benutzer ist bereits diesem Standort zugeordnet
        return res.status(400).json({ 
          message: 'Dieser Benutzer ist bereits mit diesem Standort verknüpft.' 
        });
      }
      
      // Einladung für existierenden Benutzer speichern
      await pool.query(
        'INSERT INTO location_invitations (email, location_id, invited_by, role, token, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, locationId, req.user.userId, role, token, expires]
      );
    } else {
      // Einladung für neuen Benutzer speichern
      await pool.query(
        'INSERT INTO location_invitations (email, location_id, invited_by, role, token, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, locationId, req.user.userId, role, token, expires]
      );
    }
    
    // E-Mail mit Einladungslink senden
    const invitationUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
    await sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      subject: `Einladung zum Standort ${location.name}`,
      text: `Sie wurden zum Standort ${location.name} eingeladen. Bitte klicken Sie auf den folgenden Link, um die Einladung anzunehmen: ${invitationUrl}`,
      html: `<p>Sie wurden zum Standort ${location.name} eingeladen.</p>
             <p>Bitte klicken Sie auf den folgenden Link, um die Einladung anzunehmen:</p>
             <p><a href="${invitationUrl}">${invitationUrl}</a></p>`
    });
    
    res.status(201).json({ 
      message: 'Einladung erfolgreich versendet.' 
    });
  } catch (error) {
    console.error('Invite user to location error:', error);
    res.status(500).json({ message: 'Fehler beim Einladen des Benutzers.' });
  }
});

// Einladung annehmen und Passwort festlegen
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Einladung abrufen und prüfen
    const invitationQuery = await pool.query(
      'SELECT * FROM location_invitations WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (invitationQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Ungültige oder abgelaufene Einladung.' });
    }
    
    const invitation = invitationQuery.rows[0];
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Benutzer suchen oder neu erstellen
      const existingUserQuery = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [invitation.email]
      );
      
      let userId;
      
      if (existingUserQuery.rows.length > 0) {
        // Existierender Benutzer
        userId = existingUserQuery.rows[0].id;
      } else {
        // Neuen Benutzer erstellen
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserQuery = await client.query(
          'INSERT INTO users (email, password, role, is_active, created_by) VALUES ($1, $2, $3, true, $4) RETURNING id',
          [invitation.email, hashedPassword, invitation.role, invitation.invited_by]
        );
        userId = newUserQuery.rows[0].id;
      }
      
      // Standort dem Benutzer zuweisen
      await client.query(
        'INSERT INTO user_locations (user_id, location_id, is_active, invited_by, invited_at) VALUES ($1, $2, true, $3, NOW())',
        [userId, invitation.location_id, invitation.invited_by]
      );
      
      // Einladung löschen
      await client.query(
        'DELETE FROM location_invitations WHERE id = $1',
        [invitation.id]
      );
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Einladung erfolgreich angenommen. Sie können sich jetzt anmelden.' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Fehler beim Annehmen der Einladung.' });
  }
});

// Benutzer zu einem Standort hinzufügen (direkt ohne Einladung, nur für Developer)
router.post('/:locationId/add-user', authorize(['developer']), async (req, res) => {
  try {
    const { locationId } = req.params;
    const { userId } = req.body;
    
    // Standort prüfen
    const location = await getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Standort nicht gefunden.' });
    }
    
    // Benutzer prüfen
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    
    // Prüfen, ob Benutzer bereits dem Standort zugeordnet ist
    const existingQuery = await pool.query(
      'SELECT * FROM user_locations WHERE user_id = $1 AND location_id = $2',
      [userId, locationId]
    );
    
    if (existingQuery.rows.length > 0) {
      return res.status(400).json({ message: 'Benutzer ist diesem Standort bereits zugeordnet.' });
    }
    
    // Benutzer zum Standort hinzufügen
    await pool.query(
      'INSERT INTO user_locations (user_id, location_id, is_active, invited_by, invited_at) VALUES ($1, $2, true, $3, NOW())',
      [userId, locationId, req.user.userId]
    );
    
    res.json({ message: 'Benutzer erfolgreich zum Standort hinzugefügt.' });
  } catch (error) {
    console.error('Add user to location error:', error);
    res.status(500).json({ message: 'Fehler beim Hinzufügen des Benutzers zum Standort.' });
  }
});

// Status eines Benutzers an einem Standort ändern
router.post('/user-status', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId, locationId, isActive } = req.body;
    
    // Prüfen, ob der aktuelle Benutzer Zugriff auf diesen Standort hat
    if (req.user.role !== 'developer') {
      const userLocations = await getUserLocations(req.user.userId);
      const hasAccess = userLocations.some(loc => loc.id === locationId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort.' });
      }
    }
    
    // Beziehung aktualisieren
    const updateQuery = await pool.query(
      'UPDATE user_locations SET is_active = $1 WHERE user_id = $2 AND location_id = $3 RETURNING *',
      [isActive, userId, locationId]
    );
    
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer-Standort-Zuordnung nicht gefunden.' });
    }
    
    res.json({ 
      message: `Benutzer wurde ${isActive ? 'aktiviert' : 'deaktiviert'} für diesen Standort.`,
      userLocation: updateQuery.rows[0]
    });
  } catch (error) {
    console.error('Update user location status error:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzerstatus für diesen Standort.' });
  }
});

// Abrufen aller Standorte, an denen ein Benutzer inaktiv ist
router.get('/inactive-locations/:userId', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT l.* FROM locations l
      JOIN user_locations ul ON l.id = ul.location_id
      WHERE ul.user_id = $1 AND ul.is_active = false
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inactive locations error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der inaktiven Standorte.' });
  }
});

export default router;
