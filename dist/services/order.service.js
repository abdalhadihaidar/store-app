"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const orderItem_model_1 = __importDefault(require("../models/orderItem.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const user_model_1 = require("../models/user.model");
class OrderService {
    static async getAllOrders(requestingUserId, requestingUserRole) {
        const query = {
            include: [
                {
                    model: orderItem_model_1.default,
                    as: 'items',
                    include: [{ model: product_model_1.default, as: 'product' }],
                },
                { model: user_model_1.User, as: 'user' },
            ],
        };
        // For non-admin users, only return their own orders
        if (requestingUserRole !== 'admin') {
            query.where = { userId: requestingUserId };
        }
        return await order_model_1.default.findAll(query);
    }
    static async getOrderById(id) {
        const order = await order_model_1.default.findByPk(id);
        if (!order)
            throw new Error('Order not found');
        return order;
    }
    static async getOrdersByUserId(userId) {
        return await order_model_1.default.findAll({ where: { userId } });
    }
    // ✅ User creates an order with a price change request
    static async createOrder(userId, orderData) {
        const transaction = await order_model_1.default.sequelize?.transaction();
        try {
            let totalPrice = 0;
            const order = await order_model_1.default.create({ userId, status: 'pending', totalPrice, isPriceChangeRequested: true }, { transaction });
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
                    originalPrice: product.price, // ✅ Save original price
                    adjustedPrice: null, // ✅ Admin will adjust this later
                }, { transaction });
            }
            await order.update({ totalPrice }, { transaction });
            await transaction?.commit();
            return order;
        }
        catch (error) {
            await transaction?.rollback();
            throw error;
        }
    }
    // ✅ Admin modifies prices & approves order
    static async approveOrder(orderId, updatedItems) {
        const order = await order_model_1.default.findByPk(orderId);
        if (!order)
            throw new Error('Order not found');
        let newTotal = 0;
        for (const item of updatedItems) {
            const orderItem = await orderItem_model_1.default.findByPk(item.itemId);
            if (!orderItem)
                throw new Error(`Order Item with ID ${item.itemId} not found`);
            await orderItem.update({ adjustedPrice: item.newPrice });
            newTotal += item.newPrice * orderItem.quantity;
        }
        await order.update({ totalPrice: newTotal, status: 'approved', isPriceChangeRequested: false });
        return order;
    }
    // ✅ Finalize order after admin approval
    static async completeOrder(orderId) {
        const order = await order_model_1.default.findByPk(orderId);
        if (!order)
            throw new Error('Order not found');
        return await order.update({ status: 'completed' });
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
