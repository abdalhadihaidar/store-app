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
        console.log('🔍 getAllOrders called with:', {
          userRole: req.user?.role,
          storeId: req.query.storeId,
          page: req.query.page,
          size: req.query.size
        });

        // Use the user info already set by authMiddleware
        const userRole = req.user?.role;
        const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 25;
        
        if (!userRole) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }
  
        console.log('📊 Calling OrderService.getAllOrders with:', { userRole, storeId, page, size });
        
        // Get orders based on user role and optional store filter
        const { count, rows } = await OrderService.getAllOrders(userRole, storeId, page, size);
        
        console.log('✅ Orders retrieved successfully:', { count, rowsCount: rows.length });
        res.json({ total: count, page, size, data: rows });
  
      } catch (error) {
        console.error('❌ Error in getAllOrders:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        next(error);
      }
    }
    static async createOrder(req: Request, res: Response) {
      try {
        if (!req.user) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }
        
        const isAdmin = req.user.role === 'admin';
        const order = await OrderService.createOrder(
          req.user.id,
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
          ...order,
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
        if (!req.user) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }
        
        const returns = await ReturnService.createReturnRequest(
          Number(req.params.id),
          req.user.id,
          req.body.items
        );
        res.status(201).json(returns);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
    static async getAllReturns(req: Request, res: Response) {
      try {
        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 25;

        const { count, rows } = await ReturnService.getAllReturns(page, size);
        res.json({ total: count, page, size, data: rows });
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

  static async getOrdersForAngebot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.query;
      const orders = await OrderService.getOrdersForAngebot(storeId ? Number(storeId) : undefined);
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }

  // Update adjusted prices for order items
  static async updateAdjustedPrices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);
      const { items } = req.body; // Array of { itemId, adjustedPrice, taxRate }

      if (!items || !Array.isArray(items)) {
        res.status(400).json({ message: 'Items array is required' });
        return;
      }

      console.log('🔧 Updating adjusted prices for order:', orderId, 'items:', items.length);

      const result = await OrderService.updateAdjustedPrices(orderId, items);
      
      res.json({
        success: true,
        message: 'Adjusted prices updated successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error updating adjusted prices:', error);
      next(error);
    }
  }

  // Create angebot from order
  static async createAngebotFromOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);
      const { validUntil, notes } = req.body;

      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      console.log('📄 Creating angebot from order:', orderId);

      const angebot = await OrderService.createAngebotFromOrder(
        orderId,
        req.user.id,
        validUntil ? new Date(validUntil) : undefined,
        notes
      );

      res.json({
        success: true,
        message: 'Angebot created successfully',
        data: angebot
      });
    } catch (error) {
      console.error('❌ Error creating angebot:', error);
      next(error);
    }
  }

  // Approve order (after client accepts angebot)
  static async approveOrderFromAngebot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Number(req.params.id);

      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      console.log('✅ Approving order from angebot:', orderId);

      const order = await OrderService.approveOrderFromAngebot(orderId, req.user.id);

      res.json({
        success: true,
        message: 'Order approved successfully',
        data: order
      });
    } catch (error) {
      console.error('❌ Error approving order:', error);
      next(error);
    }
  }

  // Debug endpoint to test database connectivity
  static async testDatabaseConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic database connectivity
      const { Order } = await import('../models/order.model');
      const sequelize = Order.sequelize;
      
      if (!sequelize) {
        throw new Error('Sequelize instance not found');
      }

      // Test authentication
      await sequelize.authenticate();
      console.log('✅ Database authentication successful');

      // Test simple query
      const result = await Order.count();
      console.log('✅ Database query successful, order count:', result);

      res.json({
        success: true,
        message: 'Database connection is working',
        orderCount: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      next(error);
    }
  }
}
