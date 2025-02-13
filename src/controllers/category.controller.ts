import { NextFunction, Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { upload } from '../services/fileUpload.service';
const DEFAULT_CATEGORY_IMAGE = '/uploads/default-category.jpg';
export class CategoryController {
  static async getCategories(req: Request, res: Response) {
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
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      try {
        const imagePath = req.file ? `/uploads/${req.file.filename}` : DEFAULT_CATEGORY_IMAGE;
        const category = await CategoryService.createCategory({ ...req.body, image: imagePath });
        res.status(201).json(category);
      } catch (error) {
        next(error);
      }
    });
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
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
