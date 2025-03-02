"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const store_model_1 = __importDefault(require("../models/store.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
class StoreService {
    static async createStore(storeData) {
        return await store_model_1.default.create(storeData);
    }
    static async getStoreById(storeId) {
        const store = await store_model_1.default.findByPk(storeId, {
            include: [{
                    model: user_model_1.default,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }]
        });
        if (!store)
            throw new Error('Store not found');
        return store;
    }
    static async searchStores(city, postalCode) {
        return await store_model_1.default.findAll({
            where: {
                ...(city && { city }),
                ...(postalCode && { postalCode })
            },
            include: [{
                    model: user_model_1.default,
                    as: 'user',
                    attributes: ['name']
                }]
        });
    }
    static async getAllStores(options) {
        const { page, limit, city, postalCode } = options;
        const offset = (page - 1) * limit;
        return await store_model_1.default.findAndCountAll({
            where: {
                ...(city && { city }),
                ...(postalCode && { postalCode })
            },
            limit,
            offset,
            include: [{ model: user_model_1.default, as: 'user', attributes: ['name'] }]
        });
    }
    static async getStoreByUserId(userId) {
        const store = await store_model_1.default.findOne({ where: { userId } });
        if (!store)
            throw new Error('Store not found');
        return store;
    }
    static async updateStore(storeId, updateData) {
        const store = await store_model_1.default.findByPk(storeId);
        if (!store)
            throw new Error('Store not found');
        return await store.update(updateData);
    }
    static async deleteStore(storeId) {
        const store = await store_model_1.default.findByPk(storeId);
        if (!store)
            throw new Error('Store not found');
        await store.destroy();
    }
}
exports.StoreService = StoreService;
