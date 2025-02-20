import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(400).json({message: error instanceof Error ? error.message : 'An unknown error occurred'});
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
      console.log(req.params.userId)
      const userId = Number(req.params.userId);
      console.log(userId)
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
}
