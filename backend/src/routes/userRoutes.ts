// backend/src/routes/userRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getUsersByLocation, getUserById, deactivateUser } from '../models/User';

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

// Deactivate a user (new route)
router.delete('/:userId', authorize(['developer', 'lead']), async (req, res) => {
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

export default router;
