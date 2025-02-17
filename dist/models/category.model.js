"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Category extends sequelize_1.Model {
}
exports.Category = Category;
Category.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    image: { type: sequelize_1.DataTypes.STRING, allowNull: true, defaultValue: '/uploads/default-category.jpg' },
}, { sequelize: database_1.default, tableName: 'categories' });
exports.default = Category;
// ✅ Import models after defining Category
const product_model_1 = __importDefault(require("./product.model"));
const categoryImage_model_1 = __importDefault(require("./categoryImage.model"));
// ✅ Define associations after both models are defined
Category.hasMany(product_model_1.default, { foreignKey: 'categoryId', as: 'products' });
//Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasOne(categoryImage_model_1.default, { foreignKey: 'categoryId', as: 'images' });
//CategoryImage.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
