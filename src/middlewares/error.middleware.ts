import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('🚨 Error Handler caught error:', {
    message: err.message,
    name: err.name,
    status: err.status,
    stack: err.stack,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage
  });

  const status = err.status || 500;
  
  // Handle specific database connection errors
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    console.error('🔌 Database connection error detected');
    res.status(500).json({
      error: {
        message: 'Database connection error. Please try again later.',
        type: 'DATABASE_CONNECTION_ERROR',
        code: err.code
      },
    });
    return;
  }

  // Handle Sequelize errors
  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeConnectionError') {
    console.error('🗄️ Sequelize database error detected');
    res.status(500).json({
      error: {
        message: 'Database operation failed. Please check your request and try again.',
        type: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
    });
    return;
  }

  res.status(status).json({
    error: {
      message: err.message || 'Something went wrong',
      type: err.name || 'UNKNOWN_ERROR',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      } : undefined
    },
  });
}
