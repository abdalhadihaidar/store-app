"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
class ProductService {
    static async getAllProducts() {
        return await product_model_1.default.findAll();
    }
    static async getProductById(id) {
        const product = await product_model_1.default.findByPk(id);
        if (!product)
            throw new Error('Product not found');
        return product;
    }
    static async createProduct(productData) {
        return await product_model_1.default.create(productData);
    }
    static async updateProduct(productId, updateData) {
        const product = await product_model_1.default.findByPk(productId);
        if (!product)
            throw new Error('Product not found');
        return await product.update(updateData);
    }
    static async deleteProduct(productId) {
        const product = await product_model_1.default.findByPk(productId);
        if (!product)
            throw new Error('Product not found');
        await product.destroy();
    }
}
exports.ProductService = ProductService;
