// backend/src/routes/emailTemplateRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getEmailTemplates, createEmailTemplate } from '../models/User';
import logger from '../config/logger';

const router = express.Router();
router.use(authenticate);

// Endpunkt für E-Mail-Templates abrufen
router.get('/location/:locationId', checkLocationAccess, async (req, res) => {
  try {
    logger.info(`Abrufen von E-Mail-Vorlagen für Standort: ${req.params.locationId}`);
    
    // Demo-Modus: Beispiel-Vorlagen zurückgeben
    if (process.env.DEMO_MODE === 'true') {
      return res.json([
        {
          id: "template-1",
          name: "Willkommens-E-Mail",
          subject: "Willkommen im System",
          body: "Hallo {{name}}, wir begrüßen Sie herzlich!",
          location_id: req.params.locationId,
          created_at: new Date().toISOString()
        }
      ]);
    }
    
    // Handle default-location Sonderfall
    const locationId = req.params.locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : req.params.locationId;
      
    const templates = await getEmailTemplates(locationId);
    res.json(templates);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der E-Mail-Vorlagen: ${error}`);
    res.status(500).json({ message: 'Fehler beim Abrufen der E-Mail-Vorlagen.' });
  }
});

// Neue Template erstellen
router.post('/', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { name, subject, body, locationId } = req.body;
    
    // Eingabevalidierung
    if (!name || !subject || !body || !locationId) {
      return res.status(400).json({
        message: 'Alle Felder sind erforderlich: name, subject, body, locationId'
      });
    }
    
    // Demo-Modus: Erfolg simulieren
    if (process.env.DEMO_MODE === 'true') {
      return res.status(201).json({
        id: `template-${Date.now()}`,
        name,
        subject,
        body,
        location_id: locationId,
        created_at: new Date().toISOString()
      });
    }
    
    // Handle default-location Sonderfall
    const actualLocationId = locationId === 'default-location' 
      ? '22222222-2222-2222-2222-222222222222' 
      : locationId;
    
    const template = await createEmailTemplate(
      name,
      subject,
      body,
      actualLocationId,
      req.user.userId
    );
    
    res.status(201).json(template);
  } catch (error) {
    logger.error(`Fehler beim Erstellen der E-Mail-Vorlage: ${error}`);
    res.status(500).json({ message: 'Fehler beim Erstellen der E-Mail-Vorlage.' });
  }
});

export default router;
