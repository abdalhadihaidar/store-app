import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  package:number;
  numberperpackage:number;
  quantity: number;
  taxRate: number; // Add this line
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number;
  public categoryId!: number;
  public package!: number;
  public numberperpackage!:number;
  public quantity!: number;
  public taxRate!: number; // Add this line
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    package: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    numberperpackage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }, // ✅ Add quantity field
    taxRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.15 // Set default tax rate
    }
  },
  { sequelize, tableName: 'products' }
);

export default Product;

// ✅ Import models after defining Product
import Category from './category.model';
import ProductImage from './productImage.model';

// ✅ Define associations after both models are defined
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
//Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
//ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
