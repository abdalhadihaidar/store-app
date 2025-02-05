"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
class OrderController {
    static async getOrders(req, res) {
        const orders = await order_service_1.OrderService.getAllOrders(req.user.role, req.user.id);
        res.json(orders);
    }
    static async createOrder(req, res) {
        try {
            const order = await order_service_1.OrderService.createOrder(req.user.id, req.body);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async updateOrderStatus(req, res) {
        try {
            const order = await order_service_1.OrderService.updateOrderStatus(req.params.id, req.body.status);
            res.json(order);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
}
exports.OrderController = OrderController;
