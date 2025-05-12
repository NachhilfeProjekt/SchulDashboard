import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { DatabaseError } from 'pg';

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

export const errorConverter = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (err instanceof ValidationError) {
    error = new APIError(`Validation error: ${err.message}`, 400);
  } else if (err instanceof DatabaseError) {
    error = new APIError('Database error', 500);
  } else if (!(error instanceof APIError)) {
    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new APIError(message, statusCode, false);
  }

  next(error);
};
