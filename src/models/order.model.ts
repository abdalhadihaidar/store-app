import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Order extends Model {
  id!: number; // Add this property
  userId!: number;
  status!: string;
  totalPrice!: number;
}

Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, tableName: 'orders' }
);

export default Order;
