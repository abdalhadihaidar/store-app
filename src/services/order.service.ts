import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import Return from '../models/return.model';
import Store from '../models/store.model';
import { User } from '../models/user.model';

export class OrderService {
  static async getAllOrders(requestingUserId: number, requestingUserRole: string) {
    const query: any = {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }], // ✅ Correct alias
        },
        { 
          model: User, 
          as: 'user' // ✅ Matches Order's association alias
        },
      ],
    };

    // For non-admin users, only return their own orders
    if (requestingUserRole !== 'admin') {
      query.where = { userId: requestingUserId };
    }

    return await Order.findAll(query);
  }
  static async getOrderById(id: number) {
    const order = await Order.findByPk(id);
    if (!order) throw new Error('Order not found');
    return order;
  }
  static async getOrdersByUserId(userId: number) {
    return await Order.findAll({ where: { userId } });
  }
  // ✅ User creates an order with a price change request
  static async createOrder(creatorId: number, isAdmin: boolean, orderData: {
    userId: number;
    storeId: number;
    items: Array<{
      productId: number;
      quantity: number;
      isPackage?: boolean;
    }>;
    isPriceChangeRequested?: boolean;
    isPOS?: boolean;
  }) {
    const transaction = await Order.sequelize?.transaction();
    try {
      let totalPrice = 0;
      let totalTax = 0;

      // Validate user permissions
      if (!isAdmin && creatorId !== orderData.userId) {
        throw new Error('Unauthorized order creation');
      }

      const order = await Order.create({
        userId: orderData.userId,
        storeId: orderData.storeId,
        status: orderData.isPOS ? 'approved' : 'new',
        isPOS: orderData.isPOS || false,
        isPriceChangeRequested: orderData.isPriceChangeRequested || false,
        totalPrice: 0,
        totalTax: 0
      }, { transaction });

      for (const item of orderData.items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) throw new Error(`Product ${item.productId} not found`);

      // Calculate packages and units from total quantity (units)
const packages = Math.floor(item.quantity / product.numberperpackage);
const units = item.quantity % product.numberperpackage;

        const price = product.price * product.quantity;
        const tax = price * product.taxRate;

        totalPrice += price;
        totalTax += tax;

        await OrderItem.create({
          orderId: order.id,
          productId: product.id,
          quantity: product.quantity,
          packages,
          originalPrice: product.price,
          adjustedPrice: orderData.isPOS ? product.price : null,
          taxRate: product.taxRate,
          taxAmount: tax
        }, { transaction });
      }

      await order.update({ totalPrice, totalTax }, { transaction });
      await transaction?.commit();
      return order;

    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }

  static async getOrderDetails(orderId: number) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Store,
          as: 'store',
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        {
          model: User,
          as: 'user',
        },
        {
          model: Return, // ✅ Include return requests
          as: 'returns',
        },
      ],
    });
  
    if (!order) {
      throw new Error('Order not found');
    }
  
    if (!order.storeId) {
      console.error(`Order ${orderId} does not have an associated store.`);
      throw new Error('Store is not associated to Order!');
    }
  
    return order;
  }
  static async approveOrder(orderId: number, userRole: string, updatedItems?: Array<{ itemId: number; newPrice: number }>) {
    const transaction = await Order.sequelize?.transaction();
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) throw new Error('Order not found');
  
      // ✅ If client is approving, they should not pass updatedItems
      if (userRole === 'client' && updatedItems && updatedItems.length > 0) {
        throw new Error('Clients cannot modify order prices');
      }
  
      let totalPrice = order.totalPrice;
      let totalTax = order.totalTax;
  
      // ✅ If admin is approving, update prices
      if (userRole === 'admin' && updatedItems) {
        totalPrice = 0;
        totalTax = 0;
  
        const items = await OrderItem.findAll({ where: { orderId }, transaction });
  
        for (const item of items) {
          const update = updatedItems.find(u => u.itemId === item.id);
          if (update) {
            const price = update.newPrice * item.quantity;
            const tax = price * item.taxRate;
  
            await item.update({
              adjustedPrice: update.newPrice,
              taxAmount: tax
            }, { transaction });
  
            totalPrice += price;
            totalTax += tax;
          }
        }
      }
  
      // ✅ Order is approved (same logic for admin & client)
      await order.update({ totalPrice, totalTax, status: 'approved' }, { transaction });
  
      await transaction?.commit();
      return order;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }
  

  // ✅ Finalize order after admin approval
  static async completeOrder(orderId: number) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');
    return await order.update({ status: 'completed' });
  }


  static async updateOrderStatus(orderId: string, status: "pending" | "completed") {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');
  
    return await order.update({ status });
  }
  

  static async deleteOrder(orderId: string) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    await order.destroy();
  }
}
