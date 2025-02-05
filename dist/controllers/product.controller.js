"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
class ProductController {
    static async getProducts(req, res) {
        const products = await product_service_1.ProductService.getAllProducts();
        res.json(products);
    }
    static async createProduct(req, res) {
        try {
            const product = await product_service_1.ProductService.createProduct(req.body);
            res.status(201).json(product);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
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
