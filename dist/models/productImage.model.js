"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const product_model_1 = __importDefault(require("./product.model"));
class ProductImage extends sequelize_1.Model {
}
exports.ProductImage = ProductImage;
ProductImage.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    imageUrl: { type: sequelize_1.DataTypes.STRING, allowNull: false },
}, { sequelize: database_1.default, tableName: 'product_images' });
// ✅ One-to-Many: A Product has multiple images
ProductImage.belongsTo(product_model_1.default, { foreignKey: 'productId', as: 'product' });
product_model_1.default.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
exports.default = ProductImage;
