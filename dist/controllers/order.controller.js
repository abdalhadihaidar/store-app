"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const return_service_1 = require("../services/return.service");
class OrderController {
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
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const { id } = req.params;
            const { updatedItems } = req.body;
            const order = await order_service_1.OrderService.approveOrder(Number(id), decoded.role, updatedItems);
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
            // console.log(decoded)
            // 4. Now use the decoded values
            const userId = decoded.id;
            const userRole = decoded.role;
            // Rest of your controller logic...
            const orders = await order_service_1.OrderService.getAllOrders(userId, userRole);
            res.json(orders);
        }
        catch (error) {
            next(error);
        }
    }
    static async createOrder(req, res) {
        try {
            const isAdmin = req.user.role === 'admin';
            const order = await order_service_1.OrderService.createOrder(req.user.id, isAdmin, req.body);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async getOrderDetails(req, res) {
        try {
            const order = await order_service_1.OrderService.getOrderDetails(Number(req.params.id));
            if (!order)
                throw new Error('Order not found');
            // Add detailed price breakdown
            const response = {
                ...order.toJSON(),
                priceBreakdown: {
                    subtotal: order.totalPrice,
                    tax: order.totalTax,
                    total: order.totalPrice + order.totalTax
                }
            };
            res.json(response);
        }
        catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
    static async createReturn(req, res) {
        try {
            const returns = await return_service_1.ReturnService.createReturnRequest(Number(req.params.id), req.user.id, req.body.items);
            res.status(201).json(returns);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async getAllReturns(req, res) {
        try {
            const returns = await return_service_1.ReturnService.getAllReturns();
            res.json(returns);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
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
