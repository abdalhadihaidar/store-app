import Product from '../models/product.model';

export class ProductService {
  static async getAllProducts() {
    return await Product.findAll();
  }
  static async getProductById(id: number) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    return product;
  }


  static async getProductsByCategoryId(categoryId: number) {
    return await Product.findAll({ where: { categoryId } });
  }

  static async createProduct(productData: { name: string; price: number; categoryId: number; images?: string[] }) {
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
