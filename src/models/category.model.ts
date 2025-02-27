import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Category extends Model {}
Category.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    image: { 
      type: DataTypes.STRING, 
      allowNull: true, 
      defaultValue: '/uploads/default-category.jpg' 
    },
  },
  { 
    sequelize, 
    tableName: 'categories',
    modelName: 'Category'  // Add modelName for better typing
  }
);

export default Category;

// ✅ Import models after defining Category
import Product from './product.model';
import CategoryImage from './categoryImage.model';

// ✅ Define associations after both models are defined
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
//Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasOne(CategoryImage, { foreignKey: 'categoryId', as: 'images' });
//CategoryImage.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
