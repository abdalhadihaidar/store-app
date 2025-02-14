"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
const fileUpload_service_1 = require("../services/fileUpload.service");
class ProductController {
    static async getProducts(req, res, next) {
        try {
            const products = await product_service_1.ProductService.getAllProducts();
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res) {
        try {
            const product = await product_service_1.ProductService.getProductById(Number(req.params.id));
            res.json(product);
        }
        catch (error) {
            res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async getProductsByCategoryId(req, res) {
        try {
            const categoryId = Number(req.params.categoryId);
            const products = await product_service_1.ProductService.getProductsByCategoryId(categoryId);
            res.json(products);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async createProduct(req, res, next) {
        fileUpload_service_1.upload.array('images', 4)(req, res, async (err) => {
            if (err)
                return res.status(400).json({ message: err.message });
            try {
                const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
                const product = await product_service_1.ProductService.createProduct({ ...req.body, images: imagePaths });
                res.status(201).json(product);
            }
            catch (error) {
                next(error);
            }
        });
    }
    static async updateProduct(req, res) {
        try {
            const product = await product_service_1.ProductService.updateProduct(req.params.id, req.body);
            res.json(product);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async deleteProduct(req, res) {
        try {
            await product_service_1.ProductService.deleteProduct(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
}
exports.ProductController = ProductController;
