"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
// models/store.model.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Store extends sequelize_1.Model {
}
exports.Store = Store;
Store.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    postalCode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    },
}, {
    sequelize: database_1.default,
    tableName: 'stores',
    timestamps: true,
    indexes: [
        {
            fields: ['postalCode'],
        }
    ]
});
// Associations
user_model_1.default.hasOne(Store, { foreignKey: 'userId', as: 'store' });
Store.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = Store;
