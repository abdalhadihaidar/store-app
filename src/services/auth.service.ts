import bcrypt from 'bcryptjs';
import User from '../models/user.model';
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
}
