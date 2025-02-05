import Product from '../models/product.model';

export class ProductService {
  static async getAllProducts() {
    return await Product.findAll();
  }

  static async createProduct(productData: { name: string; price: number }) {
    return await Product.create(productData);
  }

  static async updateProduct(productId: string, updateData: { name?: string; price?: number }) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Product not found');

    return await product.update(updateData);
  }

  static async deleteProduct(productId: string) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Product not found');

    await product.destroy();
  }
}
