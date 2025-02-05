"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
class CategoryController {
    static async getCategories(req, res) {
        const categories = await category_service_1.CategoryService.getAllCategories();
        res.json(categories);
    }
    static async createCategory(req, res) {
        try {
            const category = await category_service_1.CategoryService.createCategory(req.body);
            res.status(201).json(category);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async updateCategory(req, res) {
        try {
            const category = await category_service_1.CategoryService.updateCategory(req.params.id, req.body);
            res.json(category);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async deleteCategory(req, res) {
        try {
            await category_service_1.CategoryService.deleteCategory(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
}
exports.CategoryController = CategoryController;
