import User from '../models/user.model';

export class UserService {
  static async getAllUsers() {
    return await User.findAll();
  }

  static async getUserById(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  static async updateUser(userId: number, updateData: { name?: string; email?: string; role?: 'admin' | 'client' }) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    return await user.update(updateData);
  }

  static async deleteUser(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    await user.destroy();
  }
}
