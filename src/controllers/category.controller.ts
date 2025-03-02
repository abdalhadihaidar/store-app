import { NextFunction, Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { categoryImageUpload } from '../services/fileUpload.service';
import multer from 'multer';
const DEFAULT_CATEGORY_IMAGE = '/uploads/default-category.jpg';
// Proper type extension for Multer requests
interface MulterCategoryRequest extends Request {
  file?: Express.Multer.File;
}

export class CategoryController {
  static async getCategories(_req: Request, res: Response) {
    const categories = await CategoryService.getAllCategories();
    res.json(categories);
  }
  static async getById(req: Request, res: Response) {
    try {
      const category = await CategoryService.getCategoryById(Number(req.params.id));
      res.json(category);
    } catch (error) {
      res.status(404).json({  message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    const multerReq = req as MulterCategoryRequest;
    
    categoryImageUpload(multerReq, res, async (err: unknown) => {
      if (err) {
        return res.status(400).json({ // Add return here
          message: err instanceof multer.MulterError
            ? err.code === 'LIMIT_FILE_SIZE'
              ? 'Image too large (max 5MB)'
              : 'Invalid file type'
            : 'File upload error'
        });
      }
  
      try {
        const imagePath = multerReq.file 
          ? `/uploads/${multerReq.file.filename}`
          : DEFAULT_CATEGORY_IMAGE;
  
        const category = await CategoryService.createCategory({ 
          name: req.body.name,
          image: imagePath 
        });
        return res.status(201).json(category); // Add return
      } catch (error) {
        return next(error); // Add return
      }
    });
  }
  
  static async updateCategory(req: Request, res: Response) {
    const multerReq = req as MulterCategoryRequest;
    
    categoryImageUpload(multerReq, res, async (err: unknown) => {
      if (err) {
        return res.status(400).json({ // Add return
          message: err instanceof multer.MulterError
            ? err.message
            : 'File upload error'
        });
      }
  
      try {
        const updateData = {
          name: multerReq.body.name,
          image: multerReq.file 
            ? `/uploads/${multerReq.file.filename}`
            : multerReq.body.existingImage
        };
  
        const category = await CategoryService.updateCategory(
          multerReq.params.id, 
          updateData
        );
        
        return res.json(category); // Add return
      } catch (error) {
        return res.status(400).json({ // Add return
          message: error instanceof Error 
            ? error.message 
            : 'Unknown error occurred'
        });
      }
    });
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
}
