// imageUpload.controller.ts
import { Request, Response } from 'express';
import { generalImageUpload } from '../services/fileUpload.service';
import multer from 'multer';

export class ImageUploadController {
  static async uploadImages(req: Request, res: Response) {
    generalImageUpload(req, res, (err: unknown) => {
      if (err) {
        return res.status(400).json({ // Add return
          message: err instanceof multer.MulterError
            ? (err as multer.MulterError).code === 'LIMIT_FILE_SIZE'
              ? 'File too large (max 5MB)'
              : 'Too many files (max 4)'
            : 'File upload failed'
        });
      }
  
      try {
        const files = (req.files as Express.Multer.File[]) || [];
        const imagePaths = files.map(file => `/uploads/${file.filename}`);
        return res.json({ images: imagePaths }); // Add return
      } catch (error) {
        return res.status(500).json({ message: 'Image processing failed' }); // Add return
      }
    });
  }
}