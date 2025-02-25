import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/user.model';
import { sendPasswordResetEmail } from '../utils/email.util';
import { generateToken } from '../utils/jwt.util';

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
  static async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Prevent email enumeration

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = bcrypt.hashSync(resetToken, 10);
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpires,
    });

    const resetUrl = `https://brother-investment-group.com/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  static async resetPassword(token: string, newPassword: string) {
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

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await userFound.update({
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return { message: 'Password reset successful' };
  }
}
