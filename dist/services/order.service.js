"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
const orderItem_model_1 = __importDefault(require("../models/orderItem.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const return_model_1 = __importDefault(require("../models/return.model"));
const store_model_1 = __importDefault(require("../models/store.model"));
const user_model_1 = require("../models/user.model");
class OrderService {
    static async getAllOrders(requestingUserId, requestingUserRole) {
        const query = {
            include: [
                {
                    model: orderItem_model_1.default,
                    as: 'items',
                    include: [{ model: product_model_1.default, as: 'product' }], // ✅ Correct alias
                },
                {
                    model: user_model_1.User,
                    as: 'user' // ✅ Matches Order's association alias
                },
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
    static async createOrder(creatorId, isAdmin, orderData) {
        const transaction = await order_model_1.default.sequelize?.transaction();
        try {
            let totalPrice = 0;
            let totalTax = 0;
            // Validate user permissions
            if (!isAdmin && creatorId !== orderData.userId) {
                throw new Error('Unauthorized order creation');
            }
            const order = await order_model_1.default.create({
                userId: orderData.userId,
                storeId: orderData.storeId,
                status: orderData.isPOS ? 'approved' : 'new',
                isPOS: orderData.isPOS || false,
                isPriceChangeRequested: orderData.isPriceChangeRequested || false,
                totalPrice: 0,
                totalTax: 0
            }, { transaction });
            for (const item of orderData.items) {
                const product = await product_model_1.default.findByPk(item.productId, { transaction });
                if (!product)
                    throw new Error(`Product ${item.productId} not found`);
                // Calculate packages and units from total quantity (units)
                const packages = Math.floor(item.quantity / product.numberperpackage);
                const units = item.quantity % product.numberperpackage;
                const price = product.price * product.quantity;
                const tax = price * product.taxRate;
                totalPrice += price;
                totalTax += tax;
                await orderItem_model_1.default.create({
                    orderId: order.id,
                    productId: product.id,
                    quantity: product.quantity,
                    packages,
                    originalPrice: product.price,
                    adjustedPrice: orderData.isPOS ? product.price : null,
                    taxRate: product.taxRate,
                    taxAmount: tax
                }, { transaction });
            }
            await order.update({ totalPrice, totalTax }, { transaction });
            await transaction?.commit();
            return order;
        }
        catch (error) {
            await transaction?.rollback();
            throw error;
        }
    }
    static async getOrderDetails(orderId) {
        const order = await order_model_1.default.findByPk(orderId, {
            include: [
                {
                    model: store_model_1.default,
                    as: 'store',
                },
                {
                    model: orderItem_model_1.default,
                    as: 'items',
                    include: [{ model: product_model_1.default, as: 'product' }],
                },
                {
                    model: user_model_1.User,
                    as: 'user',
                },
                {
                    model: return_model_1.default, // ✅ Include return requests
                    as: 'returns',
                },
            ],
        });
        if (!order) {
            throw new Error('Order not found');
        }
        if (!order.storeId) {
            console.error(`Order ${orderId} does not have an associated store.`);
            throw new Error('Store is not associated to Order!');
        }
        return order;
    }
    static async approveOrder(orderId, userRole, updatedItems) {
        const transaction = await order_model_1.default.sequelize?.transaction();
        try {
            const order = await order_model_1.default.findByPk(orderId, { transaction });
            if (!order)
                throw new Error('Order not found');
            // ✅ If client is approving, they should not pass updatedItems
            if (userRole === 'client' && updatedItems && updatedItems.length > 0) {
                throw new Error('Clients cannot modify order prices');
            }
            let totalPrice = order.totalPrice;
            let totalTax = order.totalTax;
            // ✅ If admin is approving, update prices
            if (userRole === 'admin' && updatedItems) {
                totalPrice = 0;
                totalTax = 0;
                const items = await orderItem_model_1.default.findAll({ where: { orderId }, transaction });
                for (const item of items) {
                    const update = updatedItems.find(u => u.itemId === item.id);
                    if (update) {
                        const price = update.newPrice * item.quantity;
                        const tax = price * item.taxRate;
                        await item.update({
                            adjustedPrice: update.newPrice,
                            taxAmount: tax
                        }, { transaction });
                        totalPrice += price;
                        totalTax += tax;
                    }
                }
            }
            // ✅ Order is approved (same logic for admin & client)
            await order.update({ totalPrice, totalTax, status: 'approved' }, { transaction });
            await transaction?.commit();
            return order;
        }
        catch (error) {
            await transaction?.rollback();
            throw error;
        }
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
