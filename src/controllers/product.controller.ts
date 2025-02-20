import { NextFunction, Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { productImageUpload } from '../services/fileUpload.service';
// Add type extension for Multer files
interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}
export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  static async getProductsByCategoryId(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = Number(req.params.categoryId);
      const products = await ProductService.getProductsByCategoryId(categoryId);
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, price, categoryId, quantity, images } = req.body;
      
      if (!name || !price || !categoryId || !quantity || !images) {
        res.status(400).json({ message: 'All fields are required!' });
        return; // ✅ Explicit return
      }
      
      const product = await ProductService.createProduct({
        name,
        price: Number(price),
        categoryId: Number(categoryId),
        quantity: Number(quantity),
        images
      });
      
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    const multerReq = req as MulterRequest;
    
    try {
      productImageUpload(multerReq, res, async (err: unknown) => {
        if (err) return next(err);

        const productData = {
          ...multerReq.body,
          images: [
            ...(JSON.parse(multerReq.body.existingImages || '[]')),
            ...(multerReq.files?.map(file => `/uploads/${file.filename}`) || [])
          ]
        };

        const product = await ProductService.updateProduct(
          multerReq.params.id, 
          productData
        );
        res.json(product);
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
