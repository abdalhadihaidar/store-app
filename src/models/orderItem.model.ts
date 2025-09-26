import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class OrderItem extends Model {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number; // Total pieces (calculated from packages × VPE)
  public packages!: number; // Number of packages (can be fractional)
  public originalPrice!: number; // Price per packet
  public adjustedPrice!: number | null; // Adjusted price per packet
  public taxRate!: number; // Tax percentage
  public taxAmount!: number; // Calculated tax
  public unitPerPackageSnapshot!: number; // VPE snapshot
  // Add association properties
  public order?: Order;
  public product?: Product;
}

OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false }, // Total pieces (calculated)
    originalPrice: { type: DataTypes.FLOAT, allowNull: false }, // Price per packet
    adjustedPrice: { type: DataTypes.FLOAT, allowNull: true }, // Adjusted price per packet
    packages: {
      type: DataTypes.FLOAT, // Allow fractional packages
      allowNull: false,
      defaultValue: 0
    },
    unitPerPackageSnapshot: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    taxRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0.15 // Example 15% tax
    },
    taxAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  },
  { sequelize, tableName: 'order_items' }
);

export default OrderItem;

// ✅ Move imports after defining OrderItem
import Order from './order.model';
import Product from './product.model';

// Associations are defined in models/index.ts
