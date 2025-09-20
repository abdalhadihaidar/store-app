import { NextFunction, Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { categoryImageUpload } from '../services/fileUpload.service';
import multer from 'multer';
const DEFAULT_CATEGORY_IMAGE = '/images/default-category.jpg';
// Proper type extension for Multer requests
interface MulterCategoryRequest extends Request {
  file?: Express.Multer.File;
}

export class CategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const size = Number(req.query.size) || 25;

      const { count, rows } = await CategoryService.getAllCategories(page, size);

      res.json({ total: count, page, size, data: rows });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const category = await CategoryService.getCategoryById(Number(req.params.id));
      res.json(category);
    } catch (error) {
      res.status(404).json({  message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  /**
   * Create category with image path (new method)
   */
  static async createCategoryWithImagePath(req: Request, res: Response): Promise<void> {
    try {
      const { name, image } = req.body;

      if (!name) {
        res.status(400).json({ message: 'Category name is required' });
        return;
      }

      const category = await CategoryService.createCategory({ 
        name,
        image: image || DEFAULT_CATEGORY_IMAGE
      });
      
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }

  /**
   * Legacy create category method (deprecated)
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    const multerReq = req as MulterCategoryRequest;
    
    categoryImageUpload(multerReq, res, async (err: unknown) => {
      if (err) {
        return res.status(400).json({ // Add return here
          message: err instanceof multer.MulterError
            ? (err as multer.MulterError).code === 'LIMIT_FILE_SIZE'
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
  
  /**
   * Update category with image path (new method)
   */
  static async updateCategoryWithImagePath(req: Request, res: Response): Promise<void> {
    try {
      const { name, image } = req.body;
      const categoryId = req.params.id;

      if (!name) {
        res.status(400).json({ message: 'Category name is required' });
        return;
      }

      const updateData: { name: string; image?: string } = { name };
      if (image) {
        updateData.image = image;
      }

      const category = await CategoryService.updateCategory(categoryId, updateData);
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }

  /**
   * Legacy update category method (deprecated)
   */
  static async updateCategory(req: Request, res: Response) {
    const multerReq = req as MulterCategoryRequest;
    
    categoryImageUpload(multerReq, res, async (err: unknown) => {
      if (err) {
        return res.status(400).json({ // Add return
          message: err instanceof multer.MulterError
            ? (err as multer.MulterError).message
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
