import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import pool from '../config/database';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Kein Token vorhanden. Authentifizierung fehlgeschlagen.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token ungültig. Authentifizierung fehlgeschlagen.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Zugriff verweigert. Sie haben nicht die erforderlichen Berechtigungen.' });
    }
    next();
  };
};

export const checkLocationAccess = async (req: Request, res: Response, next: NextFunction) => {
  const { locationId } = req.params;
  const { userId, role } = req.user;

  // Developers have access to all locations
  if (role === 'developer') return next();

  // Check if user has access to the requested location
  const result = await pool.query(
    'SELECT 1 FROM user_locations WHERE user_id = $1 AND location_id = $2',
    [userId, locationId]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ message: 'Zugriff verweigert. Sie haben keine Berechtigung für diesen Standort.' });
  }

  next();
};