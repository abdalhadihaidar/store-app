import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Category from './category.model';

export class Product extends Model {
  id!: number; // Use '!' to assert that these fields will be defined
  name!: string;
  price!: number;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, tableName: 'products' }
);

Product.belongsTo(Category);

export default Product;
