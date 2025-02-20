import Product from '../models/product.model';
import ProductImage from '../models/productImage.model';
export class ProductService {
  static async getAllProducts() {
    return await Product.findAll({
      include: [{ model: ProductImage, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
    });
  }

  static async getProductById(id: number) {
    const product = await Product.findByPk(id, {
      include: [{ model: ProductImage, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
    });
    if (!product) throw new Error('Product not found');
    return product;
  }

  static async getProductsByCategoryId(categoryId: number) {
    return await Product.findAll({
      where: { categoryId },
      include: [{ model: ProductImage, as: 'images', attributes: ['imageUrl'] }] // ✅ Include images
    });
  }
  static async createProduct(productData: { name: string; price: number; categoryId: number; quantity: number; images?: string[] }) {
    const product = await Product.create(productData);
  
    // ✅ Store images separately in `ProductImage` table
    if (productData.images && productData.images.length > 0) {
      await Promise.all(
        productData.images.map(imagePath =>
          ProductImage.create({ productId: product.id, imageUrl: imagePath })
        )
      );
    }
  
    return product;
  }

  static async updateProduct(
    productId: string,
    updateData: {
      name?: string;
      price?: number;
      quantity?: number;
      categoryId?: number;
      images?: string[];
    }
  ) {
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    if (!product) throw new Error('Product not found');
  
    // Update product fields
    await product.update(updateData);
  
    // Update images
    if (updateData.images) {
      // Remove existing images
      await ProductImage.destroy({ where: { productId } });
  
      // Add new images
      await Promise.all(
        updateData.images.map(imageUrl =>
          ProductImage.create({ productId: product.id, imageUrl })
        )
      );
    }
  
    return product.reload({ include: [{ model: ProductImage, as: 'images' }] });
  }

  static async deleteProduct(productId: string) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Product not found');

    await product.destroy();
  }
}
