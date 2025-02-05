import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
  res.status(500).json({ message: errorMessage });
};
