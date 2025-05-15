import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { 
  getUsersByLocation, 
  getUserById, 
  deactivateUser, 
  reactivateUser, 
  deleteUser, 
  getDeactivatedUsers,
  getUserActivityLog
} from '../models/User';

const router = express.Router();

router.use(authenticate);

// Get users for a specific location
router.get('/location/:locationId', authorize(['developer', 'lead']), checkLocationAccess, async (req, res) => {
  try {
    const users = await getUsersByLocation(req.params.locationId);
    res.json(users);
  } catch (error) {
    console.error('Get users by location error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer.' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    
    // Don't return password hash
    const { password, temporaryToken, temporaryTokenExpires, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzerdaten.' });
  }
});

// Get deactivated users (only for developers)
router.get('/deactivated', authorize(['developer']), async (req, res) => {
  try {
    const users = await getDeactivatedUsers();
    res.json(users);
  } catch (error) {
    console.error('Get deactivated users error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der deaktivierten Benutzer.' });
  }
});

// Get user activity log (only for developers)
router.get('/:userId/activity-log', authorize(['developer']), async (req, res) => {
  try {
    const activityLog = await getUserActivityLog(req.params.userId);
    res.json(activityLog);
  } catch (error) {
    console.error('Get user activity log error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Benutzeraktivitätsprotokolls.' });
  }
});

// Deactivate a user (only for leads and developers)
router.post('/:userId/deactivate', authorize(['developer', 'lead']), async (req, res) => {
  try {
    // Ensure the user can't deactivate themselves
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({ message: 'Sie können Ihren eigenen Account nicht deaktivieren.' });
    }
    
    // Ensure developers can only be deactivated by other developers
    const targetUser = await getUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    
    if (targetUser.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Nur Entwickler können andere Entwickler deaktivieren.' });
    }
    
    // Call deactivateUser function
    await deactivateUser(req.params.userId, req.user.userId);
    
    res.json({ message: 'Benutzer erfolgreich deaktiviert.' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Fehler beim Deaktivieren des Benutzers.' });
  }
});

// Reactivate a user (only for developers)
router.post('/:userId/reactivate', authorize(['developer']), async (req, res) => {
  try {
    const targetUser = await getUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    
    if (targetUser.is_active) {
      return res.status(400).json({ message: 'Benutzer ist bereits aktiv.' });
    }
    
    // Call reactivateUser function
    await reactivateUser(req.params.userId, req.user.userId);
    
    res.json({ message: 'Benutzer erfolgreich reaktiviert.' });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ message: 'Fehler beim Reaktivieren des Benutzers.' });
  }
});

// Permanently delete a user (only for developers)
router.delete('/:userId', authorize(['developer']), async (req, res) => {
  try {
    // Ensure the user can't delete themselves
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({ message: 'Sie können Ihren eigenen Account nicht löschen.' });
    }
    
    const targetUser = await getUserById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    
    // Call deleteUser function
    const success = await deleteUser(req.params.userId);
    
    if (success) {
      res.json({ message: 'Benutzer erfolgreich gelöscht.' });
    } else {
      res.status(500).json({ message: 'Fehler beim Löschen des Benutzers.' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Benutzers.' });
  }
});
// Benutzer an einem bestimmten Standort deaktivieren
router.post('/:userId/locations/:locationId/deactivate', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId, locationId } = req.params;
    
    // Berechtigung prüfen (nur Developer können überall deaktivieren, Leitungen nur an ihren Standorten)
    if (req.user.role !== 'developer') {
      // Prüfen, ob der Benutzer Leitung an diesem Standort ist
      const hasAccess = req.user.locations.includes(locationId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Sie haben keine Berechtigung für diesen Standort.' });
      }
    }
    
    // Benutzer für diesen Standort deaktivieren
    const result = await pool.query(
      'UPDATE user_locations SET is_active = false WHERE user_id = $1 AND location_id = $2 RETURNING *',
      [userId, locationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer-Standort-Zuordnung nicht gefunden.' });
    }
    
    res.json({ 
      message: 'Benutzer wurde für diesen Standort deaktiviert.',
      userLocation: result.rows[0] 
    });
  } catch (error) {
    console.error('Deactivate user at location error:', error);
    res.status(500).json({ message: 'Fehler beim Deaktivieren des Benutzers für diesen Standort.' });
  }
});

// Benutzer an einem bestimmten Standort reaktivieren
router.post('/:userId/locations/:locationId/reactivate', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId, locationId } = req.params;
    
    // Berechtigung prüfen
    if (req.user.role !== 'developer') {
      const hasAccess = req.user.locations.includes(locationId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Sie haben keine Berechtigung für diesen Standort.' });
      }
    }
    
    // Benutzer für diesen Standort reaktivieren
    const result = await pool.query(
      'UPDATE user_locations SET is_active = true WHERE user_id = $1 AND location_id = $2 RETURNING *',
      [userId, locationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer-Standort-Zuordnung nicht gefunden.' });
    }
    
    res.json({ 
      message: 'Benutzer wurde für diesen Standort reaktiviert.',
      userLocation: result.rows[0] 
    });
  } catch (error) {
    console.error('Reactivate user at location error:', error);
    res.status(500).json({ message: 'Fehler beim Reaktivieren des Benutzers für diesen Standort.' });
  }
});

// Benutzer zu einem Standort einladen (für Leads und Developer)
router.post('/:userId/invite-to-location', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { locationId } = req.body;
    
    // Prüfen, ob Benutzer existiert
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    const user = userQuery.rows[0];
    
    // Prüfen, ob Standort existiert
    const locationQuery = await pool.query('SELECT * FROM locations WHERE id = $1', [locationId]);
    if (locationQuery.rows.length === 0) {
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
    
    // Prüfen, ob Benutzer bereits mit diesem Standort verknüpft ist
    const existingQuery = await pool.query(
      'SELECT * FROM user_locations WHERE user_id = $1 AND location_id = $2',
      [userId, locationId]
    );
    
    if (existingQuery.rows.length > 0) {
      // Wenn deaktiviert, reaktivieren
      if (!existingQuery.rows[0].is_active) {
        await pool.query(
          'UPDATE user_locations SET is_active = true, invited_by = $1, invited_at = NOW() WHERE user_id = $2 AND location_id = $3',
          [req.user.userId, userId, locationId]
        );
        return res.json({ message: 'Benutzer wurde für diesen Standort reaktiviert.' });
      }
      return res.status(400).json({ message: 'Benutzer ist diesem Standort bereits zugeordnet.' });
    }
    
    // Benutzer zum Standort hinzufügen
    await pool.query(
      'INSERT INTO user_locations (user_id, location_id, is_active, invited_by, invited_at) VALUES ($1, $2, true, $3, NOW())',
      [userId, locationId, req.user.userId]
    );
    
    res.json({ message: 'Benutzer erfolgreich zum Standort hinzugefügt.' });
  } catch (error) {
    console.error('Invite user to location error:', error);
    res.status(500).json({ message: 'Fehler beim Einladen des Benutzers zum Standort.' });
  }
});

// Aktive Standorte eines Benutzers abrufen
router.get('/:userId/active-locations', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Berechtigungsprüfung - nur der Benutzer selbst oder Lead/Developer dürfen dies sehen
    if (req.user.userId !== userId && req.user.role !== 'developer' && req.user.role !== 'lead') {
      return res.status(403).json({ message: 'Keine Berechtigung für diese Operation.' });
    }
    
    const query = `
      SELECT l.* FROM locations l
      JOIN user_locations ul ON l.id = ul.location_id
      WHERE ul.user_id = $1 AND ul.is_active = true
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der aktiven Standorte.' });
  }
});

export default router;
