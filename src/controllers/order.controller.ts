import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import jwt from 'jsonwebtoken';
export class OrderController {
    // ✅ User creates an order with a price change request
    static async createOrder(req: Request, res: Response, next: NextFunction) {
      try {
        const { userId, items ,isPriceChangeRequested} = req.body;
        console.log(req.body)
        console.log(userId)
        console.log(items)
        const order = await OrderService.createOrder(userId, { items },isPriceChangeRequested);
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
    static async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void>  {
      try {
        // 1. Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ message: 'Unauthorized' });
          return ;
        }
  
        // 2. Extract token
        const token = authHeader.split(' ')[1];
  
        // 3. Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
          userId: number; 
          role: string 
        };
  
        // 4. Now use the decoded values
        const userId = decoded.userId;
        const userRole = decoded.role;
  
        // Rest of your controller logic...
        const orders = await OrderService.getAllOrders(userId,userRole );
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
