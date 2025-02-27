import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

export class Order extends Model {
  public id!: number;
  public userId!: number;
  public status!: 'pending' | 'approved' | 'completed';
  public totalPrice!: number;
  public isPriceChangeRequested!: boolean;
}

Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'completed'), allowNull: false, defaultValue: 'pending' },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    isPriceChangeRequested: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'orders' }
);

export default Order;

// ✅ Import OrderItem after defining Order
import OrderItem from './orderItem.model';

// ✅ Define association after both models are defined
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
//OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
// After Order model definition
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user' // This matches the alias used in the query
});