import User from '../models/user.model';

export class UserService {
  /**
   * Get paginated users list
   */
  static async getAllUsers(page = 1, size = 25) {
    const limit = size;
    const offset = (page - 1) * size;
    return await User.findAndCountAll({
      limit,
      offset,
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
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

  // Get all clients
  static async getClients() {
    return await User.findAll({
      where: { role: 'client' },
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });
  }
}
