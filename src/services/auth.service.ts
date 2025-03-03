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
      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error("User not found");
  
      // Generate and store hashed token
      const resetToken = Math.random().toString(36).substring(2, 12);
      const hashedToken = bcrypt.hashSync(resetToken, 12);
      
      // Set expiration (30 minutes from now)
      const expirationDate = new Date(Date.now() + 30 * 60 * 1000);
  
      await user.update({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expirationDate
      });
      // Send email
      const emailResponse = await sendEmail(
        email,
        "User",
        "Reset Your Password - Action Required",
        `
        <p>Hallo,</p>
          <p>Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Wenn Sie diese Anfrage gestellt haben, klicken Sie bitte auf die Schaltfläche unten, um Ihr Passwort zurückzusetzen:</p>
          <p style="text-align: center;">
          <a href="https://dashboard.brother-investment-group.com/reset-password/${resetToken}"
               style="display: inline-block; padding: 12px 20px; hintergrundfarbe: #007bff; farbe: #ffffff; textdekoration: keine; schriftstärke: fett; randradius: 5px;">
               Passwort zurücksetzen
            </a>
          </p>
          <p>Wenn Sie keine Passwort-Zurücksetzung angefordert haben, können Sie diese E-Mail getrost ignorieren.</p>
          <p>Aus Sicherheitsgründen läuft dieser Link in 30 Minuten ab.</p>
          <p>Mit freundlichen Grüßen</p>
          <p><strong>Brother Investment Group</strong></p>
        `
      );
      

     
      return "Password reset email sent successfully.";
    } catch (error: unknown) {
     
      throw new Error("Failed to process password reset request.");
    }
  }

  
  static async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new Error('Missing required parameters');
    }
  
    // Find user with valid token and expiration date
    const user = await User.findOne({
      where: {
        resetPasswordExpires: { [Op.gt]: new Date() }, // Ensure token is not expired
        resetPasswordToken: { [Op.eq]: token } // Match the plain token (no hashing)
      }
    });
  
    if (!user) throw new Error('Invalid or expired token');
  
    // Validate new password length
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  
    // Ensure new password is different from the current password
    if (bcrypt.compareSync(newPassword, user.password)) {
      throw new Error('New password must be different');
    }
  
    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
  
    // Update user password and reset token data
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
  
    return { message: 'Password reset successful' };
  }
}  
