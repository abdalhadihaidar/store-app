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
        // Calculate quantity based on package and numberperpackage
        const quantity = productData.package * productData.numberperpackage;
        const product = await product_model_1.default.create({
            ...productData, quantity,
            taxRate: 0
        });
        if (productData.images && productData.images.length > 0) {
            await Promise.all(productData.images.map(imageUrl => productImage_model_1.default.create({ productId: product.id, imageUrl })));
        }
        return product;
    }
    static async createProductwithquantity(productData) {
        const product = await product_model_1.default.create({
            ...productData,
            package: 0, // Always set to 0
            numberperpackage: 0 // Always set to 0
            ,
            taxRate: 0
        });
        if (productData.images?.length) {
            await Promise.all(productData.images.map(imageUrl => productImage_model_1.default.create({ productId: product.id, imageUrl })));
        }
        return product;
    }
    static async updateProduct(productId, updateData) {
        const product = await product_model_1.default.findByPk(productId, {
            include: [{ model: productImage_model_1.default, as: 'images' }]
        });
        if (!product)
            throw new Error('Product not found');
        // Calculate new quantity based on package and numberperpackage
        const newPackage = updateData.package !== undefined ? updateData.package : product.package;
        const newNumberPerPackage = updateData.numberperpackage !== undefined ? updateData.numberperpackage : product.numberperpackage;
        const newQuantity = newPackage * newNumberPerPackage;
        // Update the quantity in the updateData
        const updatedDataWithQuantity = { ...updateData, quantity: newQuantity };
        await product.update(updatedDataWithQuantity);
        if (updateData.images) {
            await productImage_model_1.default.destroy({ where: { productId } });
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
    static async calculatePackages(productId, desiredQuantity) {
        const product = await product_model_1.default.findByPk(productId);
        if (!product)
            throw new Error('Product not found');
        const numberperpackage = product.numberperpackage;
        const availablePackages = product.package;
        const packagesNeeded = Math.ceil(desiredQuantity / numberperpackage);
        const totalUnits = packagesNeeded * numberperpackage;
        const excessUnits = totalUnits - desiredQuantity;
        const isSufficient = availablePackages >= packagesNeeded;
        return {
            packagesNeeded,
            totalUnits,
            excessUnits,
            isSufficient,
            availablePackages
        };
    }
}
exports.ProductService = ProductService;
