import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import { User } from '../models/user.model';

export class OrderService {
  static async getAllOrders(requestingUserId: number, requestingUserRole: string) {
    const query: any = {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        { model: User, as: 'user' },
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
  static async createOrder(userId: number, orderData: { items: { productId: number; quantity: number }[] },isPriceChangeRequested: boolean ) {
    console.log(userId )
    console.log(orderData)
    const transaction = await Order.sequelize?.transaction();
    try {
      let totalPrice = 0;
      const order = await Order.create({ userId, status: 'pending', totalPrice, isPriceChangeRequested: isPriceChangeRequested }, { transaction });

      for (const item of orderData.items) {
        const product = await Product.findByPk(item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);

        const itemPrice = product.price * item.quantity;
        totalPrice += itemPrice;

        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          originalPrice: product.price, // ✅ Save original price
          adjustedPrice: null, // ✅ Admin will adjust this later
        }, { transaction });
      }

      await order.update({ totalPrice }, { transaction });
      await transaction?.commit();
      return order;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }

  // ✅ Admin modifies prices & approves order
  static async approveOrder(orderId: number, updatedItems: { itemId: number; newPrice: number }[]) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    let newTotal = 0;

    for (const item of updatedItems) {
      const orderItem = await OrderItem.findByPk(item.itemId);
      if (!orderItem) throw new Error(`Order Item with ID ${item.itemId} not found`);

      await orderItem.update({ adjustedPrice: item.newPrice });
      newTotal += item.newPrice * orderItem.quantity;
    }

    await order.update({ totalPrice: newTotal, status: 'approved', isPriceChangeRequested: false });
    return order;
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
