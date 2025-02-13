import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';


interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  categoryId: number;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number;
  public categoryId!: number;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'products' }
);
// ✅ Import Category after defining Product
import Category from './category.model';

// ✅ Define association after both models are defined
//Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
//Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });


export default Product;
