import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { Order } from '../models/order.model';

export class StatsController {
  static async getProductCount(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await Product.count();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryCount(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await Category.count();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await Order.count({
        where: { status: 'pending' }
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveredOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await Order.count({
        where: { status: 'completed' }
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }
}