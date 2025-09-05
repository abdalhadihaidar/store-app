import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';



export class Order extends Model {
  public id!: number;
  public userId!: number;
  public storeId!: number; // Add store reference
  public status!: 'new' | 'pending' | 'approved' | 'completed' | 'returned';
  public totalPrice!: number;
  public totalTax!: number; // Add tax tracking
  public isPriceChangeRequested!: boolean;
  public isPOS!: boolean; // Flag for POS orders

   // Add association properties
   public items?: OrderItem[];
   public user?: User;
   public store?: Store;
   public returns?: Return[];
}

Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    isPriceChangeRequested: { type: DataTypes.BOOLEAN, defaultValue: false },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
     
    },
    status: {
      type: DataTypes.ENUM('new', 'pending', 'approved', 'completed', 'returned'),
      defaultValue: 'new'
    },
    totalTax: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    isPOS: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  
  },
  { sequelize, tableName: 'orders' }
);

export default Order;

// ✅ Import OrderItem after defining Order
import OrderItem from './orderItem.model';
import { User } from './user.model';
import Store from './store.model';
import Return from './return.model';
// ✅ Define association after both models are defined
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
//OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
// After Order model definition
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
Order.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
Store.hasMany(Order, { foreignKey: 'storeId', as: 'orders' });
// ✅ Order can have multiple return requests
Order.hasMany(Return, { foreignKey: 'orderId', as: 'returns' });