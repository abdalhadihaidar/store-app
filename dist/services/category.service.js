"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const category_model_1 = __importDefault(require("../models/category.model"));
class CategoryService {
    static async getAllCategories() {
        return await category_model_1.default.findAll();
    }
    static async getCategoryById(id) {
        const category = await category_model_1.default.findByPk(id);
        if (!category)
            throw new Error('Category not found');
        return category;
    }
    static async createCategory(categoryData) {
        return await category_model_1.default.create(categoryData);
    }
    static async updateCategory(categoryId, updateData) {
        const category = await category_model_1.default.findByPk(categoryId);
        if (!category)
            throw new Error('Category not found');
        return await category.update(updateData);
    }
    static async deleteCategory(categoryId) {
        const category = await category_model_1.default.findByPk(categoryId);
        if (!category)
            throw new Error('Category not found');
        await category.destroy();
    }
}
exports.CategoryService = CategoryService;
