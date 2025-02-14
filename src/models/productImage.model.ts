import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Product from './product.model';

export class ProductImage extends Model {}

ProductImage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    imageUrl: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: 'product_images' }
);

// ✅ One-to-Many: A Product has multiple images
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
//Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });

export default ProductImage;
