import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedUser {
  id: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}

export const authMiddleware = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['authorization'];
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return; // Stop here, don't continue the request
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedUser;
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Forbidden: Access denied' });
        return; // Stop here, don't continue the request
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};
