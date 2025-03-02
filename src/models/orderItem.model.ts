import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class OrderItem extends Model {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public packages!: number; // Add package count
  public originalPrice!: number;
  public adjustedPrice!: number | null;
  public taxRate!: number; // Tax percentage
  public taxAmount!: number; // Calculated tax
}

OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    originalPrice: { type: DataTypes.FLOAT, allowNull: false },
    adjustedPrice: { type: DataTypes.FLOAT, allowNull: true },
    packages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
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

// ✅ Define relationships after both models are defined
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});
