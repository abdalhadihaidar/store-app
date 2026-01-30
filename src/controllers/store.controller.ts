import { Request, Response } from 'express';
import { StoreService } from '../services/store.service';

export class StoreController {
    static async createStore(req: Request, res: Response): Promise<void> {
        try {
          const requiredFields = ['name', 'address', 'city', 'postalCode','userId'];
          const missingFields = requiredFields.filter(field => !req.body[field]);
          
          if (missingFields.length > 0) {
             res.status(400).json({
              message: `Missing required fields: ${missingFields.join(', ')}`
            });
            return;
          }
    
        
          // console.log(req.body.userId)
          const store = await StoreService.createStore({
            ...req.body
          });
          res.status(201).json(store);
        } catch (error:any) {
          console.error('Error creating store:', error);
          res.status(500).json({ message: error.message || 'Internal server error' });
        }
      }
    
      static async searchStores(req: Request, res: Response) {
        try {
          const { city, postalCode } = req.query;
          const stores = await StoreService.searchStores(
            city?.toString(),
            postalCode?.toString()
          );
          res.json(stores);
        } catch (error) {
          res.status(500).json({ message: 'Error searching stores' });
        }
      }
  static async getMyStore(req: Request, res: Response) {
    try {
      // Use userId from request body or query if no user is authenticated
      const userId = (req as any).user?.id || req.body.userId || req.query.userId;
      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }
      const store = await StoreService.getStoreByUserId(Number(userId));
      res.json(store);
    } catch (error:any) {
      res.status(404).json({ message: error.message });
    }
  }
  static async getAllStores(req: Request, res: Response) {
    try {
      const { page = 1, limit, city, postalCode } = req.query;
      // If limit is not provided or is 0, get all stores (no pagination)
      // Otherwise use the provided limit or default to 25
      const limitValue = limit === undefined || limit === '0' || limit === '' 
        ? 0 
        : Number(limit) || 25;
      const pageValue = Number(page) || 1;
      
      const { count, rows } = await StoreService.getAllStores({
        page: pageValue,
        limit: limitValue,
        city: city?.toString(),
        postalCode: postalCode?.toString()
      });
      
      // If limit is 0, return all stores without pagination info
      if (limitValue === 0) {
        res.json({ total: count, data: rows });
      } else {
        res.json({ total: count, page: pageValue, size: limitValue, data: rows });
      }
    } catch (error) {
      console.error('Error retrieving stores:', error);
      res.status(500).json({ 
        message: 'Error retrieving stores',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  static async updateStore(req: Request, res: Response) {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      const store = await StoreService.updateStore(storeId, req.body);
      res.json(store);
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async deleteStore(req: Request, res: Response) {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      await StoreService.deleteStore(storeId);
      res.status(204).send();
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getStoresByClient(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }

      const stores = await StoreService.getStoresByClientId(clientId);
      res.json(stores);
    } catch (error: any) {
      console.error('Error retrieving stores for client:', error);
      res.status(500).json({ 
        message: error.message || 'Internal server error' 
      });
    }
  }

  static async createStoreForClient(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        res.status(400).json({ message: 'Invalid client ID' });
        return;
      }

      const requiredFields = ['name', 'address', 'city', 'postalCode'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      const store = await StoreService.createStoreForClient(req.body, clientId);
      res.status(201).json(store);
    } catch (error: any) {
      console.error('Error creating store for client:', error);
      res.status(500).json({ 
        message: error.message || 'Internal server error' 
      });
    }
  }
}