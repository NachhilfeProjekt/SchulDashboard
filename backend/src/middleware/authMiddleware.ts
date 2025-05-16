// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { UserRole } from '../models/User';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        locations: string[];
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    logger.warn('Kein Token in der Anfrage gefunden');
    return res.status(401).json({ message: 'Authentifizierung erforderlich' });
  }
  
  try {
    logger.debug('Verifiziere Token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
      locations: string[];
    };
    
    logger.debug(`Token erfolgreich verifiziert für Benutzer-ID: ${decoded.userId}`);
    req.user = decoded;
    next();
    declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        locations: string[];
        email?: string; // Füge email hinzu
      };
    }
  }
}
  } catch (error) {
    logger.error(`Token-Verifizierung fehlgeschlagen: ${error}`);
    res.status(401).json({ message: 'Ungültiger Token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentifizierung erforderlich' });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unzureichende Berechtigungen: Benutzer mit Rolle ${req.user.role} versuchte auf eine Ressource zuzugreifen, die für ${roles.join(', ')} reserviert ist`);
      return res.status(403).json({ message: 'Unzureichende Berechtigungen' });
    }
    
    next();
  };
};

export const checkLocationAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentifizierung erforderlich' });
  }
  
  const locationId = req.params.locationId || req.body.locationId;
  
  if (!locationId) {
    return res.status(400).json({ message: 'Standort-ID ist erforderlich' });
  }
  
  logger.debug(`Prüfe Standortzugriff: Benutzer=${req.user.userId}, Rolle=${req.user.role}, Standort-ID=${locationId}`);
  logger.debug(`Benutzerstandorte: ${JSON.stringify(req.user.locations)}`);
  
  // Entwickler haben Zugriff auf alle Standorte
  if (req.user.role === 'developer') {
    logger.debug('Benutzer ist Entwickler - Zugriff erlaubt');
    return next();
  }
  
  // Prüfen, ob der Benutzer Zugriff auf diesen Standort hat
  if (!req.user.locations.includes(locationId)) {
    logger.warn(`Zugriff verweigert: Benutzer hat keinen Zugriff auf Standort ${locationId}`);
    return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
  }
  
  logger.debug(`Benutzer hat Zugriff auf Standort ${locationId}`);
  next();
};
