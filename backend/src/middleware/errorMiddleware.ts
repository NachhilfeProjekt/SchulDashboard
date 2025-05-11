import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { QueryFailedError } from 'pg';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number;
}

export class APIError extends Error implements AppError {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public code?: number
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorConverter = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (err instanceof ValidationError) {
    error = new APIError(`Validation error: ${err.message}`, 400);
  } else if (err instanceof QueryFailedError) {
    // PostgreSQL Fehler
    error = new APIError('Database error', 500);
  } else if (!(error instanceof APIError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new APIError(message, statusCode, false, error.code);
  }

  next(error);
};

export const errorHandler = (err: APIError, req: Request, res: Response, next: NextFunction) => {
  const { statusCode = 500, message, code } = err;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: code || statusCode,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new APIError(`Not found - ${req.method} ${req.originalUrl}`, 404));
};