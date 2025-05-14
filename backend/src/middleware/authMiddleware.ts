// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { UserRole } from '../models/User';

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
    console.log('Kein Token in der Anfrage gefunden');
    return res.status(401).json({ message: 'Authentifizierung erforderlich' });
  }

  try {
    console.log('Versuche Token zu verifizieren');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
      locations: string[];
    };
    
    console.log('Token erfolgreich verifiziert:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token-Verifizierung fehlgeschlagen:', error);
    res.status(401).json({ message: 'Ungültiger Token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentifizierung erforderlich' });
    }

    if (!roles.includes(req.user.role)) {
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

  console.log(`checkLocationAccess: User=${req.user.userId}, Role=${req.user.role}, LocationId=${locationId}`);
  console.log(`User locations: ${JSON.stringify(req.user.locations)}`);

  // Developers have access to all locations
  if (req.user.role === 'developer') {
    console.log('User ist Developer - Zugriff erlaubt');
    return next();
  }
// backend/src/middleware/authMiddleware.ts
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  console.log('Auth Header:', authHeader);
  console.log('Extrahierter Token:', token ? token.substring(0, 20) + '...' : 'kein Token');
  
  if (!token) {
    console.log('Kein Token in der Anfrage gefunden');
    return res.status(401).json({ message: 'Authentifizierung erforderlich' });
  }

  try {
    console.log('Versuche Token zu verifizieren');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
      locations: string[];
    };
    
    console.log('Token erfolgreich verifiziert:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token-Verifizierung fehlgeschlagen:', error);
    res.status(401).json({ message: 'Ungültiger Token' });
  }
};
  // Check if user has access to this location
  if (!req.user.locations.includes(locationId)) {
    console.log('User hat keinen Zugriff auf diesen Standort');
    return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
  }

  console.log('User hat Zugriff auf diesen Standort');
  next();
};
