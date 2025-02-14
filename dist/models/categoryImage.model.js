"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryImage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class CategoryImage extends sequelize_1.Model {
}
exports.CategoryImage = CategoryImage;
CategoryImage.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    imageUrl: { type: sequelize_1.DataTypes.STRING, allowNull: false },
}, { sequelize: database_1.default, tableName: 'category_images' });
exports.default = CategoryImage;
const category_model_1 = __importDefault(require("./category.model"));
CategoryImage.belongsTo(category_model_1.default, { foreignKey: 'categoryId', as: 'category' });
