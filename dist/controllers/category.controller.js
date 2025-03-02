"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const fileUpload_service_1 = require("../services/fileUpload.service");
const multer_1 = __importDefault(require("multer"));
const DEFAULT_CATEGORY_IMAGE = '/uploads/default-category.jpg';
class CategoryController {
    static async getCategories(_req, res) {
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
        const multerReq = req;
        (0, fileUpload_service_1.categoryImageUpload)(multerReq, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    message: err instanceof multer_1.default.MulterError
                        ? err.code === 'LIMIT_FILE_SIZE'
                            ? 'Image too large (max 5MB)'
                            : 'Invalid file type'
                        : 'File upload error'
                });
            }
            try {
                const imagePath = multerReq.file
                    ? `/uploads/${multerReq.file.filename}`
                    : DEFAULT_CATEGORY_IMAGE;
                const category = await category_service_1.CategoryService.createCategory({
                    name: req.body.name,
                    image: imagePath
                });
                return res.status(201).json(category); // Add return
            }
            catch (error) {
                return next(error); // Add return
            }
        });
    }
    static async updateCategory(req, res) {
        const multerReq = req;
        (0, fileUpload_service_1.categoryImageUpload)(multerReq, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    message: err instanceof multer_1.default.MulterError
                        ? err.message
                        : 'File upload error'
                });
            }
            try {
                const updateData = {
                    name: multerReq.body.name,
                    image: multerReq.file
                        ? `/uploads/${multerReq.file.filename}`
                        : multerReq.body.existingImage
                };
                const category = await category_service_1.CategoryService.updateCategory(multerReq.params.id, updateData);
                return res.json(category); // Add return
            }
            catch (error) {
                return res.status(400).json({
                    message: error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'
                });
            }
        });
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
