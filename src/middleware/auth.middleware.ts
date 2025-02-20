import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DecodedUser } from '../types';



export const authMiddleware = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedUser;
      req.user = decoded; // Now matches Express.Request type

      // Add null check for req.user
      if (req.user && roles.length && !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Forbidden: Access denied' });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  };
};