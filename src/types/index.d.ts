// src/types.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;     // Match JWT token structure
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
  id: number;          // Match JWT token structure
  role: string;
}