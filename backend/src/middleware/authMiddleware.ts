import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { UserRole } from '../models/User';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
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
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

export const checkLocationAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === UserRole.DEVELOPER) return next();
  
  const locationId = req.params.locationId || req.body.locationId;
  if (!locationId) return next();

  const result = await pool.query(
    'SELECT 1 FROM user_locations WHERE user_id = $1 AND location_id = $2',
    [req.user?.userId, locationId]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ message: 'Location access denied' });
  }
  next();
};
