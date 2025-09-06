import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';


export class CategoryImage extends Model {}

CategoryImage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    imageUrl: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: 'category_images' }
);

export default CategoryImage;
import Category from './category.model';
// Associations are defined in models/index.ts
