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
  static async createProduct(productData: {
    name: string;
    price: number;
    categoryId: number;
    package: number;
    numberperpackage: number;
    images?: string[];
  }) {
    // Calculate quantity based on package and numberperpackage
    const quantity = productData.package * productData.numberperpackage;
    const product = await Product.create({ ...productData, quantity });

    if (productData.images && productData.images.length > 0) {
      await Promise.all(
        productData.images.map(imageUrl =>
          ProductImage.create({ productId: product.id, imageUrl })
        )
      );
    }

    return product;
  }
  static async createProductwithquantity(productData: {
    name: string;
    price: number;
    categoryId: number;
    quantity: number;
    images?: string[];
  }) {
    const product = await Product.create({
      ...productData,
      package: 0,       // Always set to 0
      numberperpackage: 0 // Always set to 0
    });
  
    if (productData.images?.length) {
      await Promise.all(
        productData.images.map(imageUrl =>
          ProductImage.create({ productId: product.id, imageUrl })
      ));
    }
  
    return product;
  }

  static async updateProduct(
    productId: string,
    updateData: {
      name?: string;
      price?: number;
      package?: number;
      numberperpackage?: number;
      categoryId?: number;
      images?: string[];
    }
  ) {
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    if (!product) throw new Error('Product not found');

    // Calculate new quantity based on package and numberperpackage
    const newPackage = updateData.package !== undefined ? updateData.package : product.package;
    const newNumberPerPackage = updateData.numberperpackage !== undefined ? updateData.numberperpackage : product.numberperpackage;
    const newQuantity = newPackage * newNumberPerPackage;

    // Update the quantity in the updateData
    const updatedDataWithQuantity = { ...updateData, quantity: newQuantity };

    await product.update(updatedDataWithQuantity);

    if (updateData.images) {
      await ProductImage.destroy({ where: { productId } });
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
  static async calculatePackages(productId: number, desiredQuantity: number) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Product not found');

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
