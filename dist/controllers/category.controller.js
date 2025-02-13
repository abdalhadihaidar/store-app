"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const fileUpload_service_1 = require("../services/fileUpload.service");
const DEFAULT_CATEGORY_IMAGE = '/uploads/default-category.jpg';
class CategoryController {
    static async getCategories(req, res) {
        const categories = await category_service_1.CategoryService.getAllCategories();
        res.json(categories);
    }
    static async getById(req, res) {
        try {
            const category = await category_service_1.CategoryService.getCategoryById(Number(req.params.id));
            res.json(category);
        }
        catch (error) {
            res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async createCategory(req, res, next) {
        fileUpload_service_1.upload.single('image')(req, res, async (err) => {
            if (err)
                return res.status(400).json({ message: err.message });
            try {
                const imagePath = req.file ? `/uploads/${req.file.filename}` : DEFAULT_CATEGORY_IMAGE;
                const category = await category_service_1.CategoryService.createCategory({ ...req.body, image: imagePath });
                res.status(201).json(category);
            }
            catch (error) {
                next(error);
            }
        });
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
