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
      const userId = (req as any).user.id;
      const store = await StoreService.getStoreByUserId(userId);
      res.json(store);
    } catch (error:any) {
      res.status(404).json({ message: error.message });
    }
  }
  static async getAllStores(req: Request, res: Response) {
    try {
      const { page = 1, limit = 25, city, postalCode } = req.query;
      const { count, rows } = await StoreService.getAllStores({
        page: Number(page),
        limit: Number(limit),
        city: city?.toString(),
        postalCode: postalCode?.toString()
      });
      res.json({ total: count, page: Number(page), size: Number(limit), data: rows });
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