"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Order extends sequelize_1.Model {
}
exports.Order = Order;
Order.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'completed'), allowNull: false, defaultValue: 'pending' },
    totalPrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    isPriceChangeRequested: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize: database_1.default, tableName: 'orders' });
exports.default = Order;
// ✅ Import OrderItem after defining Order
const orderItem_model_1 = __importDefault(require("./orderItem.model"));
// ✅ Define association after both models are defined
Order.hasMany(orderItem_model_1.default, { foreignKey: 'orderId', as: 'items' });
//OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
// After Order model definition
Order.belongsTo(user_model_1.default, {
    foreignKey: 'userId',
    as: 'user' // This matches the alias used in the query
});
