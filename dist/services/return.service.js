"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnService = void 0;
const return_model_1 = __importDefault(require("../models/return.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const orderItem_model_1 = __importDefault(require("../models/orderItem.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
class ReturnService {
    static async createReturnRequest(orderId, userId, items) {
        const order = await order_model_1.default.findByPk(orderId);
        if (!order)
            throw new Error('Order not found');
        const returnRequests = [];
        for (const item of items) {
            const orderItem = await orderItem_model_1.default.findByPk(item.itemId);
            if (!orderItem)
                throw new Error(`OrderItem ${item.itemId} not found`);
            if (item.quantity > orderItem.quantity) {
                throw new Error(`Return quantity cannot exceed purchased quantity for item ${item.itemId}`);
            }
            const returnRequest = await return_model_1.default.create({
                orderId,
                orderItemId: item.itemId,
                userId,
                quantity: item.quantity,
                reason: item.reason,
                status: 'pending',
            });
            returnRequests.push(returnRequest);
        }
        // ✅ Update order status to "returned"
        await order.update({ status: 'returned' });
        return returnRequests;
    }
    static async getAllReturns() {
        return await return_model_1.default.findAll({
            include: [
                { model: order_model_1.default, as: 'order' },
                { model: orderItem_model_1.default, as: 'orderItem' },
                { model: user_model_1.default, as: 'user' },
            ],
        });
    }
}
exports.ReturnService = ReturnService;
