import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/user.model';
import { generateToken } from '../utils/jwt.util';
import {Request, Response} from 'express';
import { sendEmail } from '../utils/email.util';
export class AuthService {
  static async registerUser(userData: { name: string; email: string; password: string; role: 'admin' | 'client' }) {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) throw new Error('User already exists');

    userData.password = bcrypt.hashSync(userData.password, 10);
    const user = await User.create(userData); // TypeScript will now recognize this correctly
    return user;
  }

  static async authenticateUser(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id, user.role); // Correctly typed now
    return { token, user };
  }
  static async forgotPassword(email: string): Promise<string> {
    try {
      console.log("📨 Forgot password request received for:", email);

      // Simulate checking if user exists (Replace with database query)
      if (!email.includes("@")) {
        throw new Error("Invalid email format");
      }

      // Generate reset token (Replace with actual logic)
      const resetToken = Math.random().toString(36).substring(2, 12);

      // Send email
      const emailResponse = await sendEmail(
        email,
        "User",
        "Reset Your Password - Action Required",
        `
          <p>Hi there,</p>
          <p>We received a request to reset your password. If you made this request, please click the button below to reset your password:</p>
          <p style="text-align: center;">
          <a href="https://dashboard.brother-investment-group.com/reset-password/${resetToken}"
               style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px;">
               Reset Password
            </a>
          </p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>For security reasons, this link will expire in 30 minutes.</p>
          <p>Best regards,</p>
          <p><strong>Brother Investment Group</strong></p>
        `
      );
      

      console.log("✅ Reset email sent:", emailResponse);
      return "Password reset email sent successfully.";
    } catch (error: unknown) {
      console.error("❌ Forgot password service error:", (error as Error).message);
      throw new Error("Failed to process password reset request.");
    }
  }

  
  static async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new Error('Missing required parameters');
    }
    
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  
    const users = await User.findAll({
      where: {
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });
  
    const userFound = users.find(user => 
      user.resetPasswordToken && 
      bcrypt.compareSync(token, user.resetPasswordToken)
    );
  
    if (!userFound) throw new Error('Invalid or expired token');
  
    // Additional security: Check if password is different from previous
    if (bcrypt.compareSync(newPassword, userFound.password)) {
      throw new Error('New password must be different from current password');
    }
  
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    await userFound.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  
    return { message: 'Password reset successful' };
  }
}
