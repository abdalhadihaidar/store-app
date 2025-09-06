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
// Associations are defined in models/index.ts

export default ProductImage;
