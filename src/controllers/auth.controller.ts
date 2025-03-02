import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
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
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log("📩 Forgot Password Request Body:", req.body);
  
      const email = req.body?.email;
      if (!email) {
         res.status(400).json({ message: "Email is required" });return
      }
  
      const result = await AuthService.forgotPassword(email);
  
       res.status(200).json({ message: result });return
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Forgot password controller error:", err.message, err);
  
      if (!res.headersSent) {
         res.status(500).json({
          message: "Error processing request",
          ...(process.env.NODE_ENV === "development" && { error: err.message }),
        });return
      }
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
