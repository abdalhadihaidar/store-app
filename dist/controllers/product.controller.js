"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
const fileUpload_service_1 = require("../services/fileUpload.service");
class ProductController {
    static async getProducts(_req, res, next) {
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
            const { name, price, categoryId, package: pkg, numberperpackage, images } = req.body;
            // Validate required fields
            if (!name || !price || !categoryId || !pkg || !numberperpackage || !images) {
                res.status(400).json({ message: 'All fields are required!' });
                return;
            }
            // Convert numeric fields and validate
            const numericPrice = Number(price);
            const numericCategoryId = Number(categoryId);
            const numericPackage = Number(pkg);
            const numericNumberPerPackage = Number(numberperpackage);
            if (isNaN(numericPrice) || isNaN(numericCategoryId) || isNaN(numericPackage) || isNaN(numericNumberPerPackage)) {
                res.status(400).json({ message: 'Invalid numeric fields!' });
                return;
            }
            const product = await product_service_1.ProductService.createProduct({
                name,
                price: numericPrice,
                categoryId: numericCategoryId,
                package: numericPackage,
                numberperpackage: numericNumberPerPackage,
                images
            });
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    }
    // src/controllers/product.controller.ts
    static async createProductWithQuantity(req, res, next) {
        try {
            const { name, price, categoryId, quantity, images } = req.body;
            if (!name || !price || !categoryId || !quantity || !images) {
                res.status(400).json({ message: 'All fields are required!' });
                return;
            }
            const numericPrice = Number(price);
            const numericCategoryId = Number(categoryId);
            const numericQuantity = Number(quantity);
            if (isNaN(numericPrice) || isNaN(numericCategoryId) || isNaN(numericQuantity)) {
                res.status(400).json({ message: 'Invalid numeric fields!' });
                return;
            }
            const product = await product_service_1.ProductService.createProductwithquantity({
                name,
                price: numericPrice,
                categoryId: numericCategoryId,
                quantity: numericQuantity,
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
                // Remove 'quantity' from body to prevent manual override
                const restBody = multerReq.body; // Keep all fields including 'quantity'
                const productData = {
                    ...restBody,
                    images: [
                        ...(JSON.parse(restBody.existingImages || '[]')),
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
    static async calculatePackages(req, res, next) {
        try {
            const productId = Number(req.params.id);
            const desiredQuantity = Number(req.query.quantity);
            if (isNaN(productId))
                throw new Error('Invalid product ID');
            if (isNaN(desiredQuantity))
                throw new Error('Invalid desired quantity');
            const result = await product_service_1.ProductService.calculatePackages(productId, desiredQuantity);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
