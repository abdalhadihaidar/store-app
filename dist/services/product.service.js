"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const productImage_model_1 = __importDefault(require("../models/productImage.model"));
class ProductService {
    static async getAllProducts() {
        return await product_model_1.default.findAll({
            include: [{ model: productImage_model_1.default, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
        });
    }
    static async getProductById(id) {
        const product = await product_model_1.default.findByPk(id, {
            include: [{ model: productImage_model_1.default, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
        });
        if (!product)
            throw new Error('Product not found');
        return product;
    }
    static async getProductsByCategoryId(categoryId) {
        return await product_model_1.default.findAll({
            where: { categoryId },
            include: [{ model: productImage_model_1.default, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
        });
    }
    static async createProduct(productData) {
        const product = await product_model_1.default.create(productData);
        // ✅ Store images separately in `ProductImage` table
        if (productData.images && productData.images.length > 0) {
            await Promise.all(productData.images.map(imagePath => productImage_model_1.default.create({ productId: product.id, imageUrl: imagePath })));
        }
        return product;
    }
    static async updateProduct(productId, updateData) {
        const product = await product_model_1.default.findByPk(productId, {
            include: [{ model: productImage_model_1.default, as: 'images' }]
        });
        if (!product)
            throw new Error('Product not found');
        // Update product fields
        await product.update(updateData);
        // Update images
        if (updateData.images) {
            // Remove existing images
            await productImage_model_1.default.destroy({ where: { productId } });
            // Add new images
            await Promise.all(updateData.images.map(imageUrl => productImage_model_1.default.create({ productId: product.id, imageUrl })));
        }
        return product.reload({ include: [{ model: productImage_model_1.default, as: 'images' }] });
    }
    static async deleteProduct(productId) {
        const product = await product_model_1.default.findByPk(productId);
        if (!product)
            throw new Error('Product not found');
        await product.destroy();
    }
}
exports.ProductService = ProductService;
