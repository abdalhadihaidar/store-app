import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
  static async getOrders(req: Request, res: Response) {
    const orders = await OrderService.getAllOrders(req.user!.role, req.user!.id);
    res.json(orders);
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const order = await OrderService.createOrder(req.user!.id, req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const order = await OrderService.updateOrderStatus(req.params.id, req.body.status);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
}
