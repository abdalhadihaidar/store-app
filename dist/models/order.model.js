"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Order extends sequelize_1.Model {
}
exports.Order = Order;
Order.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    totalPrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    isPriceChangeRequested: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    storeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('new', 'pending', 'approved', 'completed', 'returned'),
        defaultValue: 'new'
    },
    totalTax: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0
    },
    isPOS: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    }
}, { sequelize: database_1.default, tableName: 'orders' });
exports.default = Order;
// ✅ Import OrderItem after defining Order
const orderItem_model_1 = __importDefault(require("./orderItem.model"));
const user_model_1 = require("./user.model");
const store_model_1 = __importDefault(require("./store.model"));
const return_model_1 = __importDefault(require("./return.model"));
// ✅ Define association after both models are defined
Order.hasMany(orderItem_model_1.default, { foreignKey: 'orderId', as: 'items' });
//OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
// After Order model definition
Order.belongsTo(user_model_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
Order.belongsTo(store_model_1.default, { foreignKey: 'storeId', as: 'store' });
store_model_1.default.hasMany(Order, { foreignKey: 'storeId', as: 'orders' });
// ✅ Order can have multiple return requests
Order.hasMany(return_model_1.default, { foreignKey: 'orderId', as: 'returns' });
