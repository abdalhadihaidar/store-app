// src/types.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;  // Changed from 'id' to 'userId'
        role: string;
      };
      files?: Multer.File[];
      file?: Multer.File;
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export interface DecodedUser {
  userId: number;       // Consistent naming
  role: string;
}