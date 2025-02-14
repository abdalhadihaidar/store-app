import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import bcrypt from 'bcryptjs';
export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.registerUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { token, user } = await AuthService.authenticateUser(email, password);
      res.json({ token, user });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }
  static async forgotPassword(req: Request, res: Response) {
    try {
      await AuthService.forgotPassword(req.body.email);
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: 'Error processing request' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      await AuthService.resetPassword(req.body.token, req.body.newPassword);
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
