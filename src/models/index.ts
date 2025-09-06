import sequelize from '../config/database';

// Import all models
import { User } from './user.model';
import Store from './store.model';
import Product from './product.model';
import ProductImage from './productImage.model';
import Category from './category.model';
import CategoryImage from './categoryImage.model';
import Order from './order.model';
import OrderItem from './orderItem.model';
import Return from './return.model';
import Invoice from './invoice.model';
import CreditNote from './creditNote.model';
import Angebot from './angebot.model';
import AngebotItemModel from './angebotItem.model';

// Define all associations
// User associations
User.hasMany(Store, { foreignKey: 'userId', as: 'stores' });
Store.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Store associations - stores are clients, not product owners

// Product associations
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'productImages' });
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Category associations
Category.hasMany(CategoryImage, { foreignKey: 'categoryId', as: 'categoryImages' });
CategoryImage.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Order associations
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'orderProduct' });

Order.hasMany(Return, { foreignKey: 'orderId', as: 'returns' });
Return.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Invoice associations
Invoice.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(Invoice, { foreignKey: 'orderId', as: 'invoices' });

// Credit Note associations
CreditNote.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(CreditNote, { foreignKey: 'orderId', as: 'creditNotes' });

// Angebot associations
Angebot.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Angebot.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Angebot.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
Angebot.hasMany(AngebotItemModel, { foreignKey: 'angebotId', as: 'items' });

AngebotItemModel.belongsTo(Angebot, { foreignKey: 'angebotId', as: 'angebot' });
AngebotItemModel.belongsTo(Product, { foreignKey: 'productId', as: 'angebotProduct' });

Order.hasMany(Angebot, { foreignKey: 'orderId', as: 'angebots' });

// Export all models
export {
  User,
  Store,
  Product,
  ProductImage,
  Category,
  CategoryImage,
  Order,
  OrderItem,
  Return,
  Invoice,
  CreditNote,
  Angebot,
  AngebotItemModel
};

export default sequelize;
