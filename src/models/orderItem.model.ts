import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Product from './product.model';
import Order from './order.model';

export class OrderItem extends Model {}

OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, tableName: 'order_items' }
);

OrderItem.belongsTo(Product);
OrderItem.belongsTo(Order);

export default OrderItem;
