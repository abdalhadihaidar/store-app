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
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1]; // ✅ Extract token correctly

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedUser;
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Forbidden: Access denied' });
        return;
      }

      next(); // Proceed to next middleware/route handler
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  };
};
