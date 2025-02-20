"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class OrderController {
    // ✅ User creates an order with a price change request
    static async createOrder(req, res, next) {
        try {
            const { userId, items } = req.body;
            const order = await order_service_1.OrderService.createOrder(userId, { items });
            res.status(201).json(order);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res) {
        try {
            const order = await order_service_1.OrderService.getOrderById(Number(req.params.id));
            res.json(order);
        }
        catch (error) {
            res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async getOrdersByUserId(req, res) {
        try {
            const userId = Number(req.params.userId);
            const orders = await order_service_1.OrderService.getOrdersByUserId(userId);
            res.json(orders);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    // ✅ Admin approves & modifies order prices
    static async approveOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { updatedItems } = req.body;
            const order = await order_service_1.OrderService.approveOrder(Number(id), updatedItems);
            res.json(order);
        }
        catch (error) {
            next(error);
        }
    }
    // ✅ Admin finalizes the order
    static async completeOrder(req, res, next) {
        try {
            const { id } = req.params;
            const order = await order_service_1.OrderService.completeOrder(Number(id));
            res.json(order);
        }
        catch (error) {
            next(error);
        }
    }
    // ✅ Get all orders (admin can see all, users see only theirs)
    static async getAllOrders(req, res, next) {
        try {
            // 1. Get token from headers
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            // 2. Extract token
            const token = authHeader.split(' ')[1];
            // 3. Verify and decode token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // 4. Now use the decoded values
            const userId = decoded.userId;
            const userRole = decoded.role;
            // Rest of your controller logic...
            const orders = await order_service_1.OrderService.getAllOrders(userId, userRole);
            res.json(orders);
        }
        catch (error) {
            next(error);
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
