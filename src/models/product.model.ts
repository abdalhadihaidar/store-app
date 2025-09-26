import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  price: number; // Price per packet
  categoryId: number;
  package: number; // Number of packets (can be fractional)
  numberperpackage: number; // VPE - units per package
  quantity: number; // Total pieces (calculated from package × numberperpackage)
  taxRate: number;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number; // Price per packet
  public categoryId!: number;
  public package!: number; // Number of packets (can be fractional)
  public numberperpackage!: number; // VPE - units per package
  public quantity!: number; // Total pieces (calculated from package × numberperpackage)
  public taxRate!: number;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    package: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // Allow fractional packages
    numberperpackage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // Total pieces (calculated)
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

// Associations are defined in models/index.ts
