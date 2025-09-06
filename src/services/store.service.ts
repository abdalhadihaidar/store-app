import Store, { StoreAttributes } from '../models/store.model';
import User from '../models/user.model';

export class StoreService {
    static async createStore(storeData: Omit<StoreAttributes, 'id'>) {
        return await Store.create(storeData);
      }
    
      static async getStoreById(storeId: number) {
        const store = await Store.findByPk(storeId, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        });
        if (!store) throw new Error('Store not found');
        return store;
      }
    
      static async searchStores(city?: string, postalCode?: string) {
        return await Store.findAll({
          where: {
            ...(city && { city }),
            ...(postalCode && { postalCode })
          },
          include: [{
            model: User,
            as: 'user',
            attributes: ['name']
          }]
        });
      }
      static async getAllStores(options: {
        page: number;
        limit: number;
        city?: string;
        postalCode?: string;
      }) {
        const { page, limit, city, postalCode } = options;
        const offset = (page - 1) * limit;
      
        return await Store.findAndCountAll({
          where: {
            ...(city && { city }),
            ...(postalCode && { postalCode })
          },
          limit,
          offset,
          include: [{ model: User, as: 'user', attributes: ['name'] }]
        });
      }

  static async getStoreByUserId(userId: number) {
    const store = await Store.findOne({ where: { userId } });
    if (!store) throw new Error('Store not found');
    return store;
  }

  static async updateStore(storeId: number, updateData: Partial<StoreAttributes>) {
    const store = await Store.findByPk(storeId);
    if (!store) throw new Error('Store not found');
    return await store.update(updateData);
  }

  static async deleteStore(storeId: number) {
    const store = await Store.findByPk(storeId);
    if (!store) throw new Error('Store not found');
    await store.destroy();
  }

  static async getStoresByClientId(clientId: number) {
    return await Store.findAll({
      where: { userId: clientId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
  }

  // Create store for a specific client
  static async createStoreForClient(storeData: Omit<StoreAttributes, 'id'>, clientId: number) {
    // Verify the client exists
    const client = await User.findByPk(clientId);
    if (!client) throw new Error('Client not found');
    if (client.role !== 'client') throw new Error('User is not a client');

    // Create store with the client's ID
    return await Store.create({
      ...storeData,
      userId: clientId
    });
  }
}