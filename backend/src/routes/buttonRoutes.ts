// backend/src/routes/buttonRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { createCustomButton, getButtonsForUser, setButtonPermissions, deleteButton } from '../models/User';
import pool from '../config/database';
import logger from '../config/logger';

const router = express.Router();

router.use(authenticate);

// Get buttons for current user at a specific location
router.get('/location/:locationId', checkLocationAccess, async (req, res) => {
  try {
    logger.info(`GET /buttons/location/${req.params.locationId} aufgerufen`);
    logger.info(`User: ${JSON.stringify(req.user)}`);
    
    // DEMO-MODUS: Beispiel-Buttons zurückgeben
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "button-1",
          name: "Moodle",
          url: "https://moodle.org",
          location_id: req.params.locationId
        },
        {
          id: "button-2",
          name: "Google Classroom",
          url: "https://classroom.google.com",
          location_id: req.params.locationId
        }
      ]);
    }
    
    // Handle default-location Sonderfall
    const locationId = req.params.locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : req.params.locationId;
    
    logger.info(`Suche Buttons für Standort: ${locationId} und Benutzer: ${req.user.userId}`);
    
    const buttons = await getButtonsForUser(req.user.userId, locationId);
    logger.info(`Buttons gefunden: ${buttons.length}`);
    
    res.json(buttons);
  } catch (error) {
    logger.error('Get buttons error:', error);
    logger.error(error.stack);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der Buttons.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Create new button (only for leads and developers)
router.post('/', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { name, url, locationId } = req.body;
    logger.info(`POST /buttons aufgerufen mit name=${name}, url=${url}, locationId=${locationId}`);
    
    // Handle default-location Sonderfall
    const actualLocationId = locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : locationId;
    
    const button = await createCustomButton(name, url, actualLocationId, req.user.userId);
    logger.info(`Button erstellt: ${JSON.stringify(button)}`);
    
    res.status(201).json(button);
  } catch (error) {
    logger.error('Create button error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Buttons.' });
  }
});

// Set button permissions (only for leads and developers)
router.post('/:buttonId/permissions', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { buttonId } = req.params;
    const { permissions } = req.body;
    logger.info(`POST /buttons/${buttonId}/permissions aufgerufen`);
    logger.info(`Permissions: ${JSON.stringify(permissions)}`);
    
    // Demo-Modus: Erfolg simulieren für Demo-Buttons
    if (process.env.DEMO_MODE === 'true' && buttonId.startsWith('button-')) {
      logger.info(`Demo-Modus: Berechtigungen für Button ${buttonId} erfolgreich aktualisiert`);
      return res.json({ message: 'Berechtigungen erfolgreich aktualisiert.' });
    }
    
    await setButtonPermissions(buttonId, permissions);
    logger.info('Berechtigungen erfolgreich aktualisiert');
    
    res.json({ message: 'Berechtigungen erfolgreich aktualisiert.' });
  } catch (error) {
    logger.error('Set button permissions error:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Button-Berechtigungen.' });
  }
});

// Delete button (only for leads and developers)
router.delete('/:buttonId', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { buttonId } = req.params;
    logger.info(`DELETE /buttons/${buttonId} aufgerufen`);
    
    // Demo-Modus: Erfolg simulieren für Demo-Buttons
    if (process.env.DEMO_MODE === 'true' && buttonId.startsWith('button-')) {
      logger.info(`Demo-Modus: Button ${buttonId} erfolgreich "gelöscht"`);
      return res.json({ message: 'Button erfolgreich gelöscht.' });
    }
    
    // Überprüfe, ob der Button existiert und dem User/Location gehört
    const buttonQuery = await pool.query(
      'SELECT * FROM custom_buttons WHERE id = $1',
      [buttonId]
    );
    
    if (buttonQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Button nicht gefunden.' });
    }
    
    const button = buttonQuery.rows[0];
    
    // Überprüfe, ob der Benutzer Zugriff auf den Standort des Buttons hat
    if (req.user.role !== 'developer' && !req.user.locations.includes(button.location_id)) {
      return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Button.' });
    }
    
    // Button löschen mit Modell-Funktion
    await deleteButton(buttonId);
    
    logger.info(`Button ${buttonId} erfolgreich gelöscht`);
    
    res.json({ message: 'Button erfolgreich gelöscht.' });
  } catch (error) {
    logger.error('Delete button error:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Buttons.' });
  }
});

export default router;
