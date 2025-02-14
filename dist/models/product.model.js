"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Product extends sequelize_1.Model {
}
exports.Product = Product;
Product.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    price: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    categoryId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
}, { sequelize: database_1.default, tableName: 'products' });
exports.default = Product;
// ✅ Import models after defining Product
const category_model_1 = __importDefault(require("./category.model"));
const productImage_model_1 = __importDefault(require("./productImage.model"));
// ✅ Define associations after both models are defined
Product.belongsTo(category_model_1.default, { foreignKey: 'categoryId', as: 'category' });
//Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.hasMany(productImage_model_1.default, { foreignKey: 'productId', as: 'images' });
//ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
