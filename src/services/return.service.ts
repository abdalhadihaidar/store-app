import Return from '../models/return.model';
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import User from '../models/user.model';

export class ReturnService {
  static async createReturnRequest(orderId: number, userId: number, items: Array<{ itemId: number; quantity: number; reason: string }>) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    const returnRequests: Return[] = [];
    for (const item of items) {
      const orderItem = await OrderItem.findByPk(item.itemId);
      if (!orderItem) throw new Error(`OrderItem ${item.itemId} not found`);

      if (item.quantity > orderItem.quantity) {
        throw new Error(`Return quantity cannot exceed purchased quantity for item ${item.itemId}`);
      }

      const returnRequest = await Return.create({
        orderId,
        orderItemId: item.itemId,
        userId,
        quantity: item.quantity,
        reason: item.reason,
        status: 'pending',
      });

      returnRequests.push(returnRequest);
    }

    // ✅ Update order status to "returned"
    await order.update({ status: 'returned' });

    return returnRequests;
  }
  static async getAllReturns(page = 1, size = 25) {
    const limit = size;
    const offset = (page - 1) * size;

    return await Return.findAndCountAll({
      limit,
      offset,
      attributes: ['id', 'orderId', 'orderItemId', 'userId', 'quantity', 'reason', 'status', 'createdAt', 'updatedAt'],
      include: [
        { model: Order, as: 'order', attributes: ['id', 'status', 'totalPrice'] },
        { model: OrderItem, as: 'orderItem', attributes: ['id', 'productId', 'quantity', 'originalPrice'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
