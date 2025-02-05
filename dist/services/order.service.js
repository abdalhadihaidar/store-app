"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const orderItem_model_1 = __importDefault(require("../models/orderItem.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
class OrderService {
    static async getAllOrders(userRole, userId) {
        if (userRole === 'admin') {
            return await order_model_1.default.findAll({ include: [orderItem_model_1.default] });
        }
        else {
            return await order_model_1.default.findAll({ where: { userId }, include: [orderItem_model_1.default] });
        }
    }
    static async createOrder(userId, orderData) {
        let totalPrice = 0;
        const order = await order_model_1.default.create({ userId, status: 'pending', totalPrice });
        for (const item of orderData.items) {
            const product = await product_model_1.default.findByPk(item.productId);
            if (!product)
                throw new Error(`Product with ID ${item.productId} not found`);
            const itemPrice = product.price * item.quantity;
            totalPrice += itemPrice;
            await orderItem_model_1.default.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: itemPrice,
            });
        }
        await order.update({ totalPrice });
        return order;
    }
    static async updateOrderStatus(orderId, status) {
        const order = await order_model_1.default.findByPk(orderId);
        if (!order)
            throw new Error('Order not found');
        return await order.update({ status });
    }
    static async deleteOrder(orderId) {
        const order = await order_model_1.default.findByPk(orderId);
        if (!order)
            throw new Error('Order not found');
        await order.destroy();
    }
}
exports.OrderService = OrderService;
