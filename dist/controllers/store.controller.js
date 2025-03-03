"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreController = void 0;
const store_service_1 = require("../services/store.service");
class StoreController {
    static async createStore(req, res) {
        try {
            const requiredFields = ['name', 'address', 'city', 'postalCode', 'userId'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                res.status(400).json({
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
                return;
            }
            // console.log(req.body.userId)
            const store = await store_service_1.StoreService.createStore({
                ...req.body
            });
            res.status(201).json(store);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async searchStores(req, res) {
        try {
            const { city, postalCode } = req.query;
            const stores = await store_service_1.StoreService.searchStores(city?.toString(), postalCode?.toString());
            res.json(stores);
        }
        catch (error) {
            res.status(500).json({ message: 'Error searching stores' });
        }
    }
    static async getMyStore(req, res) {
        try {
            const userId = req.user.id;
            const store = await store_service_1.StoreService.getStoreByUserId(userId);
            res.json(store);
        }
        catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
    static async getAllStores(req, res) {
        try {
            const { page = 1, limit = 10, city, postalCode } = req.query;
            const stores = await store_service_1.StoreService.getAllStores({
                page: Number(page),
                limit: Number(limit),
                city: city?.toString(),
                postalCode: postalCode?.toString()
            });
            res.json(stores);
        }
        catch (error) {
            res.status(500).json({ message: 'Error retrieving stores' });
        }
    }
    static async updateStore(req, res) {
        try {
            const storeId = parseInt(req.params.storeId, 10);
            const store = await store_service_1.StoreService.updateStore(storeId, req.body);
            res.json(store);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async deleteStore(req, res) {
        try {
            const storeId = parseInt(req.params.storeId, 10);
            await store_service_1.StoreService.deleteStore(storeId);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.StoreController = StoreController;
