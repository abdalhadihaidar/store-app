// src/types.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;  // Changed from 'id' to 'userId'
        role: string;
      };
    }
  }
}

export interface DecodedUser {
  userId: number;       // Consistent naming
  role: string;
}