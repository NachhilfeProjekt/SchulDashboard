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
        email: string; // E-Mail hinzugefügt
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret) as {
      userId: string;
      email: string; // E-Mail hinzugefügt
      role: UserRole;
      locations: string[];
    };
    
    logger.debug(`Token erfolgreich verifiziert für Benutzer-ID: ${decoded.userId}`);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Token-Verifizierung fehlgeschlagen: ${error}`);
    res.status(401).json({ message: 'Ungültiger Token' });
  }
};

// Rest der Datei bleibt unverändert...
