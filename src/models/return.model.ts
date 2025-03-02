import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './order.model';
import OrderItem from './orderItem.model';
import User from './user.model';

export class Return extends Model {
  public id!: number;
  public orderId!: number;
  public orderItemId!: number;
  public userId!: number;
  public quantity!: number;
  public reason!: string;
  public status!: 'pending' | 'approved' | 'rejected';
}

Return.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    orderItemId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
  },
  { sequelize, tableName: 'returns' }
);

// ✅ Associations
Return.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Return.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });
Return.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Return;
