// backend/src/services/emailService.ts
import sgMail from '@sendgrid/mail';
import logger from '../config/logger';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

// Initialisiere SendGrid, wenn ein API-Schlüssel vorhanden ist
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.info('SendGrid API initialisiert');
} else {
  logger.warn('Kein SendGrid API-Schlüssel gefunden - E-Mails werden nur protokolliert');
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Log E-Mail-Informationen (sicher für alle Umgebungen)
  logger.info(`E-Mail angefordert: An: ${options.to}, Betreff: ${options.subject}`);
  
  // Überprüfe, ob SendGrid konfiguriert ist
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send(options);
      logger.info(`E-Mail erfolgreich gesendet an: ${options.to}`);
    } catch (error) {
      logger.error(`Fehler beim Senden der E-Mail: ${error}`);
      throw error;
    }
  } else {
    // Simuliere E-Mail-Versand im Entwicklungsmodus oder wenn kein API-Schlüssel vorhanden ist
    logger.info('SIMULIERTE E-MAIL:');
    logger.info(`An: ${options.to}`);
    logger.info(`Von: ${options.from}`);
    logger.info(`Betreff: ${options.subject}`);
    logger.info(`Inhalt: ${options.text.substring(0, 100)}${options.text.length > 100 ? '...' : ''}`);
    
    // Simuliere eine erfolgreiche Lieferung
    return Promise.resolve();
  }
};
