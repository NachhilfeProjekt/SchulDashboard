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
  getUserActivityLog
} from '../models/User';
import pool from '../config/database';
import { sendEmail } from '../services/emailService';

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

export default router;
