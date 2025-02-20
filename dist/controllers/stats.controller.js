"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const product_model_1 = require("../models/product.model");
const category_model_1 = require("../models/category.model");
const order_model_1 = require("../models/order.model");
class StatsController {
    static async getProductCount(req, res, next) {
        try {
            const count = await product_model_1.Product.count();
            res.json({ count });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategoryCount(req, res, next) {
        try {
            const count = await category_model_1.Category.count();
            res.json({ count });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPendingOrders(req, res, next) {
        try {
            const count = await order_model_1.Order.count({
                where: { status: 'pending' }
            });
            res.json({ count });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDeliveredOrders(req, res, next) {
        try {
            const count = await order_model_1.Order.count({
                where: { status: 'completed' }
            });
            res.json({ count });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StatsController = StatsController;
