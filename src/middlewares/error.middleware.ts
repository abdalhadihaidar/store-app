import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Something went wrong',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
}
