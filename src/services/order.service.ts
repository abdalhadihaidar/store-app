import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';

export class OrderService {
  static async getAllOrders(userRole: string, userId: number) {
    if (userRole === 'admin') {
      return await Order.findAll({ include: [OrderItem] });
    } else {
      return await Order.findAll({ where: { userId }, include: [OrderItem] });
    }
  }

  static async createOrder(userId: number, orderData: { items: { productId: number; quantity: number }[] }) {
    let totalPrice = 0;
    const order = await Order.create({ userId, status: 'pending', totalPrice });

    for (const item of orderData.items) {
      const product = await Product.findByPk(item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found`);

      const itemPrice = product.price * item.quantity;
      totalPrice += itemPrice;

      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    await order.update({ totalPrice });
    return order;
  }

  static async updateOrderStatus(orderId: string, status: string) {
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
