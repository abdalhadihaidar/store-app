import { NextFunction, Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { productImageUpload } from '../services/fileUpload.service';

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
      const { name, price, categoryId, package: pkg, numberperpackage, images } = req.body;
      
      // Validate required fields
      if (!name || !price || !categoryId || !pkg || !numberperpackage || !images) {
        res.status(400).json({ message: 'All fields are required!' });
        return;
      }

      // Convert numeric fields and validate
      const numericPrice = Number(price);
      const numericCategoryId = Number(categoryId);
      const numericPackage = Number(pkg);
      const numericNumberPerPackage = Number(numberperpackage);

      if (isNaN(numericPrice) || isNaN(numericCategoryId) || isNaN(numericPackage) || isNaN(numericNumberPerPackage)) {
        res.status(400).json({ message: 'Invalid numeric fields!' });
        return;
      }

      const product = await ProductService.createProduct({
        name,
        price: numericPrice,
        categoryId: numericCategoryId,
        package: numericPackage,
        numberperpackage: numericNumberPerPackage,
        images
      });
      
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
// src/controllers/product.controller.ts
static async createProductWithQuantity(req: Request, res: Response, next: NextFunction): Promise<void>  {
  try {
    const { name, price, categoryId, quantity, images } = req.body;
    
    if (!name || !price || !categoryId || !quantity || !images) {
      res.status(400).json({ message: 'All fields are required!' });
      return ;
    }

    const numericPrice = Number(price);
    const numericCategoryId = Number(categoryId);
    const numericQuantity = Number(quantity);

    if (isNaN(numericPrice) || isNaN(numericCategoryId) || isNaN(numericQuantity)) {
      res.status(400).json({ message: 'Invalid numeric fields!' });
      return ;
    }

    const product = await ProductService.createProductwithquantity({
      name,
      price: numericPrice,
      categoryId: numericCategoryId,
      quantity: numericQuantity,
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

        // Remove 'quantity' from body to prevent manual override
        const { quantity, ...restBody } = multerReq.body;
        
        const productData = {
          ...restBody,
          images: [
            ...(JSON.parse(restBody.existingImages || '[]')),
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

  static async calculatePackages(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.params.id);
      const desiredQuantity = Number(req.query.quantity);

      if (isNaN(productId)) throw new Error('Invalid product ID');
      if (isNaN(desiredQuantity)) throw new Error('Invalid desired quantity');

      const result = await ProductService.calculatePackages(productId, desiredQuantity);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}