"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Return = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const order_model_1 = __importDefault(require("./order.model"));
const orderItem_model_1 = __importDefault(require("./orderItem.model"));
const user_model_1 = __importDefault(require("./user.model"));
class Return extends sequelize_1.Model {
}
exports.Return = Return;
Return.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    orderItemId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    reason: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
}, { sequelize: database_1.default, tableName: 'returns' });
// ✅ Associations
Return.belongsTo(order_model_1.default, { foreignKey: 'orderId', as: 'order' });
Return.belongsTo(orderItem_model_1.default, { foreignKey: 'orderItemId', as: 'orderItem' });
Return.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = Return;
