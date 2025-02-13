import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Category extends Model {}

Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: true, defaultValue: '/uploads/default-category.jpg' },
  },
  { sequelize, tableName: 'categories' }
);

export default Category;

// ✅ Import Product after defining Category
import Product from './product.model';

// ✅ Define association after both models are defined
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
