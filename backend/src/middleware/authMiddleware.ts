import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
      locations: string[];
    };
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole,
      locations: decoded.locations
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
