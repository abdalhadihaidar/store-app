import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
    // ✅ User creates an order with a price change request
    static async createOrder(req: Request, res: Response, next: NextFunction) {
      try {
        const { userId, items } = req.body;
        const order = await OrderService.createOrder(userId, { items });
        res.status(201).json(order);
      } catch (error) {
        next(error);
      }
    }
    static async getById(req: Request, res: Response) {
      try {
        const order = await OrderService.getOrderById(Number(req.params.id));
        res.json(order);
      } catch (error) {
        res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
      }
    }
    static async getOrdersByUserId(req: Request, res: Response) {
      try {
        const userId = Number(req.params.userId);
        const orders = await OrderService.getOrdersByUserId(userId);
        res.json(orders);
      } catch (error) {
        res.status(400).json({message: error instanceof Error ? error.message : 'An unknown error occurred'});
      }
    }
    // ✅ Admin approves & modifies order prices
    static async approveOrder(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const { updatedItems } = req.body;
        const order = await OrderService.approveOrder(Number(id), updatedItems);
        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  
    // ✅ Admin finalizes the order
    static async completeOrder(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = req.params;
        const order = await OrderService.completeOrder(Number(id));
        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  
    // ✅ Get all orders (admin can see all, users see only theirs)
    static async getAllOrders(req: Request, res: Response, next: NextFunction) {
      try {
        const userId = req.body.userId; // Extracted from token in real scenarios
        const userRole = req.body.userRole; // Extracted from auth middleware
        const orders = await OrderService.getAllOrders(userRole, userId);
        res.json(orders);
      } catch (error) {
        next(error);
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
