import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getUsersByLocation, getUserById } from '../models/User';

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

export default router;