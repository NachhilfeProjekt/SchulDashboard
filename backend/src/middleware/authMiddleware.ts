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
    return res.status(401).json({ message: 'Authentifizierung erforderlich' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
      locations: string[];
    };
    
    req.user = decoded;
    next();
  } catch (error) {
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

  // Developers have access to all locations
  if (req.user.role === 'developer') {
    return next();
  }

  // Check if user has access to this location
  if (!req.user.locations.includes(locationId)) {
    return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
  }

  next();
};
