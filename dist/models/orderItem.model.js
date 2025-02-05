"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const product_model_1 = __importDefault(require("./product.model"));
const order_model_1 = __importDefault(require("./order.model"));
class OrderItem extends sequelize_1.Model {
}
exports.OrderItem = OrderItem;
OrderItem.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    price: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
}, { sequelize: database_1.default, tableName: 'order_items' });
OrderItem.belongsTo(product_model_1.default);
OrderItem.belongsTo(order_model_1.default);
exports.default = OrderItem;
