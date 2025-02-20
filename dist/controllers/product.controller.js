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
    static async getById(req, res, next) {
        try {
            const product = await product_service_1.ProductService.getProductById(Number(req.params.id));
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    }
    static async getProductsByCategoryId(req, res, next) {
        try {
            const categoryId = Number(req.params.categoryId);
            const products = await product_service_1.ProductService.getProductsByCategoryId(categoryId);
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    }
    static async createProduct(req, res, next) {
        try {
            const { name, price, categoryId, quantity, images } = req.body;
            if (!name || !price || !categoryId || !quantity || !images) {
                res.status(400).json({ message: 'All fields are required!' });
                return; // ✅ Explicit return
            }
            const product = await product_service_1.ProductService.createProduct({
                name,
                price: Number(price),
                categoryId: Number(categoryId),
                quantity: Number(quantity),
                images
            });
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProduct(req, res, next) {
        const multerReq = req;
        try {
            (0, fileUpload_service_1.productImageUpload)(multerReq, res, async (err) => {
                if (err)
                    return next(err);
                const productData = {
                    ...multerReq.body,
                    images: [
                        ...(JSON.parse(multerReq.body.existingImages || '[]')),
                        ...(multerReq.files?.map(file => `/uploads/${file.filename}`) || [])
                    ]
                };
                const product = await product_service_1.ProductService.updateProduct(multerReq.params.id, productData);
                res.json(product);
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteProduct(req, res, next) {
        try {
            await product_service_1.ProductService.deleteProduct(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
