import { NextFunction, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { ReturnService } from '../services/return.service';
export class OrderController {
   
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
    static async approveOrder(req: Request, res: Response, next: NextFunction):Promise<void> {
      try {
        const userRole = req.user?.role;
        
        if (!userRole) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }
    
        const { id } = req.params;
        const { updatedItems } = req.body;
        
        const order = await OrderService.approveOrder(Number(id), userRole, updatedItems);
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
        // Use the user info already set by authMiddleware
        const userRole = req.user?.role;
        const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
        
        if (!userRole) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }
  
        // Get orders based on user role and optional store filter
        const orders = await OrderService.getAllOrders(userRole, storeId);
        res.json(orders);
  
      } catch (error) {
        next(error);
      }
    }
    static async createOrder(req: Request, res: Response) {
      try {
        const isAdmin = (req as any).user.role === 'admin';
        const order = await OrderService.createOrder(
          (req as any).user.id,
          isAdmin,
          req.body
        );
        res.status(201).json(order);
      } catch (error:any) {
        res.status(400).json({ message: error.message });
      }
    }
  
    static async getOrderDetails(req: Request, res: Response) {
      try {
        const order = await OrderService.getOrderDetails(Number(req.params.id));
        if (!order) throw new Error('Order not found');
        
        // Add detailed price breakdown
        const response = {
          ...order.toJSON(),
          priceBreakdown: {
            subtotal: order.totalPrice,
            tax: order.totalTax,
            total: order.totalPrice + order.totalTax
          }
        };
        
        res.json(response);
      } catch (error:any) {
        res.status(404).json({ message: error.message });
      }
    }
  
    static async createReturn(req: Request, res: Response) {
      try {
        const returns = await ReturnService.createReturnRequest(
          Number(req.params.id),
          (req as any).user.id,
          req.body.items
        );
        res.status(201).json(returns);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
    static async getAllReturns(req: Request, res: Response) {
      try {
        const returns = await ReturnService.getAllReturns();
        res.json(returns);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
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

  static async addItemToOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);
      if (isNaN(orderId)) throw new Error('Invalid orderId');
      const itemData = req.body;
      const orderItem = await OrderService.addItemToOrder(orderId, itemData);
      res.status(201).json(orderItem);
    } catch (error) {
      next(error);
    }
  }

  static async removeItemFromOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);
      const itemId = Number(req.params.itemId);
      if (isNaN(orderId) || isNaN(itemId)) throw new Error('Invalid orderId or itemId');
      await OrderService.removeItemFromOrder(orderId, itemId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
