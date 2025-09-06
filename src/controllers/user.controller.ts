import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

// User management controller
export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const size = Number(req.query.size) || 25;

      const { count, rows } = await UserService.getAllUsers(page, size);

      res.json({ total: count, page, size, data: rows });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const user = await UserService.getUserById(userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({message: error instanceof Error ? error.message : 'An unknown error occurred'});
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      // console.log(req.params.userId)
      const userId = Number(req.params.userId);
      // console.log(userId)
      const user = await UserService.updateUser(userId, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({message: error instanceof Error ? error.message : 'An unknown error occurred'});
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      await UserService.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({message: error instanceof Error ? error.message : 'An unknown error occurred'});
    }
  }

  static async createClient(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required' });
        return;
      }

      // Create client user
      const client = await AuthService.registerUser({
        name,
        email,
        password,
        role: 'client'
      });

      // Remove password from response
      const { password: _, ...clientWithoutPassword } = client.toJSON();
      res.status(201).json(clientWithoutPassword);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }

  static async getClients(_req: Request, res: Response) {
    try {
      const clients = await UserService.getClients();
      res.json(clients);
    } catch (error) {
      console.error('Error retrieving clients:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
}
