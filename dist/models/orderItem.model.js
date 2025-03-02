"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class OrderItem extends sequelize_1.Model {
}
exports.OrderItem = OrderItem;
OrderItem.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    productId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    originalPrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    adjustedPrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    packages: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    taxRate: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0.15 // Example 15% tax
    },
    taxAmount: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0
    }
}, { sequelize: database_1.default, tableName: 'order_items' });
exports.default = OrderItem;
// ✅ Move imports after defining OrderItem
const order_model_1 = __importDefault(require("./order.model"));
const product_model_1 = __importDefault(require("./product.model"));
// ✅ Define relationships after both models are defined
OrderItem.belongsTo(order_model_1.default, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(product_model_1.default, {
    foreignKey: 'productId',
    as: 'product'
});
