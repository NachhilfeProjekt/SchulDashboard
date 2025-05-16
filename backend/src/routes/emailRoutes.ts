// backend/src/routes/emailRoutes.ts
import express, { Request, Response } from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getEmailTemplates, createEmailTemplate, sendBulkEmails, resendFailedEmails } from '../models/User';
import pool from '../config/database';
import logger from '../config/logger';

const router = express.Router();

// Authentifizierung für alle Routen anwenden
router.use(authenticate);

/**
 * @route GET /api/emails/templates/location/:locationId
 * @desc E-Mail-Vorlagen für einen Standort abrufen
 * @access Private
 */
router.get('/templates/location/:locationId', checkLocationAccess, async (req: Request, res: Response) => {
  try {
    logger.info(`Abrufen von E-Mail-Vorlagen für Standort: ${req.params.locationId}`);
    const templates = await getEmailTemplates(req.params.locationId);
    
    logger.debug(`${templates.length} E-Mail-Vorlagen gefunden`);
    res.json(templates);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der E-Mail-Vorlagen: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der E-Mail-Vorlagen.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/emails/templates
 * @desc Neue E-Mail-Vorlage erstellen
 * @access Private - nur für Leads und Entwickler
 */
router.post('/templates', authorize(['developer', 'lead']), async (req: Request, res: Response) => {
  try {
    const { name, subject, body, locationId } = req.body;
    
    // Eingabevalidierung
    if (!name || !subject || !body || !locationId) {
      return res.status(400).json({ 
        message: 'Alle Felder sind erforderlich: name, subject, body, locationId' 
      });
    }
    
    logger.info(`Erstelle neue E-Mail-Vorlage: ${name} für Standort ${locationId}`);
    
    const template = await createEmailTemplate(
      name, 
      subject, 
      body, 
      locationId, 
      req.user.userId
    );
    
    logger.info(`E-Mail-Vorlage erfolgreich erstellt mit ID: ${template.id}`);
    res.status(201).json(template);
  } catch (error) {
    logger.error(`Fehler beim Erstellen der E-Mail-Vorlage: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Erstellen der E-Mail-Vorlage.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/emails/send-bulk
 * @desc Massenversand von E-Mails
 * @access Private - nur für Leads und Entwickler
 */
router.post('/send-bulk', authorize(['developer', 'lead']), async (req: Request, res: Response) => {
  try {
    const { recipients, templateId } = req.body;
    
    // Eingabevalidierung
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Gültige Empfängerliste erforderlich' });
    }
    
    if (!templateId) {
      return res.status(400).json({ message: 'Vorlagen-ID erforderlich' });
    }
    
    // Prüfen, ob die E-Mail im Benutzerobjekt vorhanden ist
    if (!req.user || !req.user.email) {
      logger.warn(`E-Mail-Versand fehlgeschlagen: E-Mail nicht im Token gefunden für Benutzer ${req.user?.userId}`);
      
      // Versuche, die E-Mail des Benutzers aus der Datenbank zu holen
      try {
        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        
        if (userResult.rows.length > 0) {
          const userEmail = userResult.rows[0].email;
          logger.info(`E-Mail aus Datenbank abgerufen: ${userEmail}`);
          
          await sendBulkEmails(recipients, templateId, userEmail);
          return res.json({ message: 'E-Mails werden versendet.' });
        } else {
          return res.status(400).json({ message: 'Benutzer-E-Mail nicht gefunden' });
        }
      } catch (dbError) {
        logger.error(`Fehler beim Abrufen der Benutzer-E-Mail: ${dbError}`);
        return res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer-E-Mail' });
      }
    }
    
    logger.info(`Versende Massen-E-Mail an ${recipients.length} Empfänger mit Vorlage ${templateId}`);
    await sendBulkEmails(recipients, templateId, req.user.email);
    
    res.json({ 
      message: 'E-Mails werden versendet.',
      count: recipients.length
    });
  } catch (error) {
    logger.error(`Fehler beim Massenversand von E-Mails: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Versenden der E-Mails.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/emails/sent
 * @desc Gesendete E-Mails für einen Standort abrufen
 * @access Private
 */
router.get('/sent', async (req: Request, res: Response) => {
  try {
    const locationId = req.query.locationId as string;
    
    if (!locationId) {
      return res.status(400).json({ message: 'Standort-ID ist erforderlich' });
    }

    // Überprüfen, ob der Benutzer Zugriff auf diesen Standort hat
    if (req.user?.role !== 'developer' && !req.user?.locations.includes(locationId)) {
      logger.warn(`Zugriff verweigert: Benutzer ${req.user?.userId} hat keinen Zugriff auf Standort ${locationId}`);
      return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
    }

    logger.info(`Abrufen gesendeter E-Mails für Standort ${locationId}`);
    
    const query = `
      SELECT * FROM sent_emails
      WHERE location_id = $1
      ORDER BY sent_at DESC`;
    
    const result = await pool.query(query, [locationId]);
    
    logger.debug(`${result.rows.length} gesendete E-Mails gefunden`);
    res.json(result.rows);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der gesendeten E-Mails: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der gesendeten E-Mails.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/emails/resend
 * @desc Fehlgeschlagene E-Mails erneut senden
 * @access Private - nur für Leads und Entwickler
 */
router.post('/resend', authorize(['developer', 'lead']), async (req: Request, res: Response) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ message: 'Gültige E-Mail-IDs sind erforderlich' });
    }
    
    logger.info(`Erneutes Senden von ${emailIds.length} E-Mails angefordert`);
    
    // Überprüfe, ob alle angegebenen E-Mails existieren und fehlgeschlagen sind
    const checkQuery = `
      SELECT id, status FROM sent_emails 
      WHERE id = ANY($1::uuid[])
    `;
    
    const checkResult = await pool.query(checkQuery, [emailIds]);
    
    if (checkResult.rows.length !== emailIds.length) {
      logger.warn(`Nicht alle angegebenen E-Mail-IDs wurden gefunden`);
      return res.status(400).json({ 
        message: 'Nicht alle angegebenen E-Mail-IDs wurden gefunden' 
      });
    }
    
    const nonFailedEmails = checkResult.rows.filter(email => email.status !== 'failed');
    if (nonFailedEmails.length > 0) {
      logger.warn(`${nonFailedEmails.length} E-Mails sind nicht im Status 'failed'`);
      return res.status(400).json({ 
        message: 'Nur fehlgeschlagene E-Mails können erneut gesendet werden',
        nonFailedIds: nonFailedEmails.map(email => email.id)
      });
    }
    
    // E-Mails erneut senden
    const success = await resendFailedEmails(emailIds);
    
    if (success) {
      logger.info(`${emailIds.length} E-Mails erfolgreich zum erneuten Senden in die Warteschlange eingereiht`);
      res.json({ 
        message: 'E-Mails werden erneut versendet.',
        count: emailIds.length
      });
    } else {
      logger.error(`Fehler beim erneuten Versenden der E-Mails`);
      res.status(500).json({ message: 'Fehler beim erneuten Versenden der E-Mails.' });
    }
  } catch (error) {
    logger.error(`Fehler beim erneuten Senden der E-Mails: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim erneuten Versenden der E-Mails.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/emails/templates/:templateId
 * @desc E-Mail-Vorlage löschen
 * @access Private - nur für Leads und Entwickler
 */
router.delete('/templates/:templateId', authorize(['developer', 'lead']), async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    // Überprüfen, ob die Vorlage existiert und Benutzer Zugriff hat
    const templateQuery = `
      SELECT * FROM email_templates 
      WHERE id = $1
    `;
    
    const templateResult = await pool.query(templateQuery, [templateId]);
    
    if (templateResult.rows.length === 0) {
      logger.warn(`E-Mail-Vorlage mit ID ${templateId} nicht gefunden`);
      return res.status(404).json({ message: 'E-Mail-Vorlage nicht gefunden' });
    }
    
    const template = templateResult.rows[0];
    
    // Überprüfen, ob der Benutzer Zugriff auf den Standort hat
    if (req.user.role !== 'developer' && !req.user.locations.includes(template.location_id)) {
      logger.warn(`Zugriff verweigert: Benutzer ${req.user.userId} hat keinen Zugriff auf Standort ${template.location_id}`);
      return res.status(403).json({ 
        message: 'Sie haben keinen Zugriff auf diese E-Mail-Vorlage' 
      });
    }
    
    // E-Mail-Vorlage löschen
    await pool.query('DELETE FROM email_templates WHERE id = $1', [templateId]);
    
    logger.info(`E-Mail-Vorlage ${templateId} erfolgreich gelöscht`);
    res.json({ message: 'E-Mail-Vorlage erfolgreich gelöscht' });
  } catch (error) {
    logger.error(`Fehler beim Löschen der E-Mail-Vorlage: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Löschen der E-Mail-Vorlage.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/emails/templates/:templateId
 * @desc Details einer E-Mail-Vorlage abrufen
 * @access Private
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    // E-Mail-Vorlage abrufen
    const templateQuery = `
      SELECT * FROM email_templates 
      WHERE id = $1
    `;
    
    const templateResult = await pool.query(templateQuery, [templateId]);
    
    if (templateResult.rows.length === 0) {
      logger.warn(`E-Mail-Vorlage mit ID ${templateId} nicht gefunden`);
      return res.status(404).json({ message: 'E-Mail-Vorlage nicht gefunden' });
    }
    
    const template = templateResult.rows[0];
    
    // Überprüfen, ob der Benutzer Zugriff auf den Standort hat
    if (req.user.role !== 'developer' && !req.user.locations.includes(template.location_id)) {
      logger.warn(`Zugriff verweigert: Benutzer ${req.user.userId} hat keinen Zugriff auf Standort ${template.location_id}`);
      return res.status(403).json({ 
        message: 'Sie haben keinen Zugriff auf diese E-Mail-Vorlage' 
      });
    }
    
    logger.info(`E-Mail-Vorlage ${templateId} erfolgreich abgerufen`);
    res.json(template);
  } catch (error) {
    logger.error(`Fehler beim Abrufen der E-Mail-Vorlage: ${error}`);
    res.status(500).json({ 
      message: 'Fehler beim Abrufen der E-Mail-Vorlage.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
