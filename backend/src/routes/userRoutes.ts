// backend/src/routes/userRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import {
  getUsersByLocation,
  getUserById,
  deactivateUser,
  reactivateUser,
  deleteUser,
  getDeactivatedUsers,
  getUserActivityLog,
  inviteUserToLocation,
  getAllUsers,
  getUserLocations
} from '../models/User';
import pool from '../config/database';
import logger from '../config/logger';

const router = express.Router();

router.use(authenticate);

// Get users for a specific location
router.get('/location/:locationId', authorize(['developer', 'lead']), checkLocationAccess, async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      // Demo-Benutzer zurückgeben
      return res.json([
        {
          id: "demo-user-1",
          email: "teacher@example.com",
          role: "teacher",
          is_active: true
        },
        {
          id: "demo-user-2",
          email: "office@example.com",
          role: "office",
          is_active: true
        }
      ]);
    }
    
    // Handle default-location Sonderfall
    const locationId = req.params.locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : req.params.locationId;
    
    const users = await getUsersByLocation(locationId);
    res.json(users);
  } catch (error) {
    logger.error('Get users by location error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer.' });
  }
});

// NEW! Get locations for current user
router.get('/locations', async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Hauptstandort"
        }
      ]);
    }
    
    const locations = await getUserLocations(req.user.userId);
    res.json(locations);
  } catch (error) {
    logger.error('Get user locations error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer-Standorte.' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json({
        id: "demo-user-id",
        email: req.user.email || "demo@example.com",
        role: req.user.role || "developer",
        is_active: true
      });
    }
    
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }
    // Don't return password hash
    const { password, temporaryToken, temporaryTokenExpires, ...userData } = user;
    res.json(userData);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzerdaten.' });
  }
});

// Get deactivated users (only for developers)
router.get('/deactivated', authorize(['developer']), async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "demo-deactivated-1",
          email: "deactivated@example.com",
          role: "teacher",
          is_active: false,
          deactivated_at: new Date()
        }
      ]);
    }
    
    const users = await getDeactivatedUsers();
    res.json(users);
  } catch (error) {
    logger.error('Get deactivated users error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der deaktivierten Benutzer.' });
  }
});

// Get all users (für die Benutzerverwaltung)
router.get('/', authorize(['developer', 'lead']), async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "demo-user-1",
          email: "demo@example.com",
          role: "developer",
          is_active: true,
          locations: [{
            id: "22222222-2222-2222-2222-222222222222",
            name: "Hauptstandort"
          }]
        },
        {
          id: "demo-user-2",
          email: "teacher@example.com",
          role: "teacher",
          is_active: true,
          locations: [{
            id: "22222222-2222-2222-2222-222222222222",
            name: "Hauptstandort"
          }]
        }
      ]);
    }
    
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen aller Benutzer.' });
  }
});

// Get user activity log (only for developers)
router.get('/:userId/activity-log', authorize(['developer']), async (req, res) => {
  try {
    // Prüfen, ob die Tabelle existiert
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          action VARCHAR(50) NOT NULL,
          performed_by UUID REFERENCES users(id),
          performed_at TIMESTAMP DEFAULT NOW(),
          details JSONB
        )
      `);
    } catch (tableError) {
      logger.error('Error checking/creating activity log table:', tableError);
    }
    
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "log-1",
          user_id: req.params.userId,
          action: "login",
          performed_at: new Date(),
          details: { method: "password" }
        }
      ]);
    }
    
    const activityLog = await getUserActivityLog(req.params.userId);
    res.json(activityLog);
  } catch (error) {
    logger.error('Get user activity log error:', error);
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
    logger.error('Deactivate user error:', error);
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
    logger.error('Reactivate user error:', error);
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
    logger.error('Delete user error:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Benutzers.' });
  }
});

// Benutzer zu einem Standort einladen
router.post('/invite', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { userId, locationId } = req.body;
    
    // Validate input
    if (!userId || !locationId) {
      return res.status(400).json({ message: 'Benutzer-ID und Standort-ID sind erforderlich' });
    }
    
    // Check if user has access to location
    if (req.user.role !== 'developer' && !req.user.locations.includes(locationId)) {
      return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
    }
    
    // Handle default-location Sonderfall
    const actualLocationId = locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : locationId;
    
    // Invite user
    await inviteUserToLocation(userId, actualLocationId);
    
    res.json({ message: 'Benutzer wurde erfolgreich zum Standort eingeladen' });
  } catch (error) {
    logger.error('Invite user error:', error);
    if (error.message) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Fehler beim Einladen des Benutzers' });
    }
  }
});

// Alle Benutzer abrufen (nur für Entwickler und Leitung)
router.get('/all', authorize(['developer', 'lead']), async (req, res) => {
  try {
    // Für Demo-Modus
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "demo-user-1",
          email: "demo@example.com",
          role: "developer",
          is_active: true,
          locations: [{
            id: "22222222-2222-2222-2222-222222222222",
            name: "Hauptstandort"
          }]
        },
        {
          id: "demo-user-2",
          email: "teacher@example.com",
          role: "teacher",
          is_active: true,
          locations: [{
            id: "22222222-2222-2222-2222-222222222222",
            name: "Hauptstandort"
          }]
        }
      ]);
    }
    
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen aller Benutzer' });
  }
});

export default router;
