import { NextFunction, Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { upload } from '../services/fileUpload.service';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.json(product);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  static async getProductsByCategoryId(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const products = await ProductService.getProductsByCategoryId(categoryId);
      res.json(products);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    upload.array('images', 4)(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      try {
        const imagePaths = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`) : [];
        const product = await ProductService.createProduct({ ...req.body, images: imagePaths });
        res.status(201).json(product);
      } catch (error) {
        next(error);
      }
    });
  }
  static async updateProduct(req: Request, res: Response) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
}
