import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    const products = await ProductService.getAllProducts();
    res.json(products);
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message  : 'An unknown error occurred'});
    }
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
