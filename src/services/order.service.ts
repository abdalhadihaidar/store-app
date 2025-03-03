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
  static async createOrder(
    creatorId: number,
    isAdmin: boolean,
    orderData: {
      userId: number;
      storeId: number;
      items: Array<{
        productId: number;
        quantity: number;
        isPackage?: boolean;
        taxRate?: number;  // ✅ Ensure taxRate is part of item
      }>;
      isPriceChangeRequested?: boolean;
      isPOS?: boolean;
    }
  )  {
    const transaction = await Order.sequelize?.transaction();
    try {
      let totalPrice = 0;
      let totalTax = 0;
  
      // ✅ Check if the user is allowed to create this order
      if (!isAdmin && creatorId !== orderData.userId) {
        throw new Error('Unauthorized order creation');
      }
  
      // ✅ Create the order
      const order = await Order.create(
        {
          userId: orderData.userId,
          storeId: orderData.storeId,
          status: orderData.isPOS ? 'completed' : 'new',
          isPOS: orderData.isPOS || false,
          isPriceChangeRequested: orderData.isPriceChangeRequested || false,
          totalPrice: 0,
          totalTax: 0
        },
        { transaction }
      );
  
      // ✅ Process each item in the order
      for (const item of orderData.items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) throw new Error(`Product ${item.productId} not found`);
  
        // ✅ Ensure tax rate is provided (from request OR product)
        const taxRate = item.taxRate ?? product.taxRate;
        let quantity = item.quantity;
        let price = 0;
       
        // ✅ Compute price & tax
              // ✅ Adjust price & quantity based on whether it's a package or unit
      if (item.isPackage) {
        // If isPackage is true, quantity is in packages
        quantity = item.quantity * product.numberperpackage; // Convert packages to units
        price = product.price * item.quantity * product.numberperpackage;
      } else {
        // If isPackage is false, quantity is in units
        price = product.price * item.quantity;
      }

        const tax = price * (taxRate / 100);
  
        totalPrice += price;
        totalTax += tax;
  
        // ✅ Handle stock reduction for POS orders
        if (orderData.isPOS) {
          if (product.quantity < quantity) {
            throw new Error(`Insufficient stock for product ${product.id}`);
          }
          product.quantity -= quantity;
          if (product.numberperpackage > 0) {
            product.package = Math.floor(product.quantity / product.numberperpackage);
          }
          await product.save({ transaction });
        }
  
        // ✅ Handle packages correctly
        const packages = item.isPackage ? item.quantity : 0;
  
        // ✅ Create OrderItem entry
        await OrderItem.create(
          {
            orderId: order.id,
            productId: product.id,
            quantity: quantity,
            packages,
            originalPrice: product.price,
            adjustedPrice: orderData.isPOS ? product.price : null,
            taxRate,
            taxAmount: tax
          },
          { transaction }
        );
      }
  
      // ✅ Update order with correct price & tax
      await order.update({ totalPrice, totalTax }, { transaction });
  
      // ✅ Commit transaction
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
    
      throw new Error('Store is not associated to Order!');
    }
  
    return order;
  }
  static async approveOrder(
    orderId: number,
    userRole: string,
    updatedItems?: Array<{ itemId: number; newPrice: number; tax?: number }>
  ) {
    const transaction = await Order.sequelize?.transaction();
    try {
      const order = await Order.findByPk(orderId, { 
        transaction,
        include: [{ model: OrderItem, as: 'items' }]
      });
      
      if (!order) throw new Error('Order not found');
  
      if (userRole === 'client' && updatedItems?.length) {
        throw new Error('Clients cannot modify order prices');
      }
  
      let totalPrice = order.totalPrice;
      let totalTax = order.totalTax;

      // ✅ If admin is approving, update prices & check stock
      if (userRole === 'admin') {
        totalPrice = 0;
        totalTax = 0;
  
        for (const item of order.items ||[]) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (!product) throw new Error(`Product ${item.productId} not found`);

          // ✅ Stock validation: Ensure we have enough quantity before approving
          if (product.quantity < item.quantity) {
            throw new Error(`Not enough stock for Product ${product.id}. Available: ${product.quantity}, Required: ${item.quantity}`);
          }
          // Update stock
        product.quantity -= item.quantity;
        await product.save({ transaction });
        

         
  
          // ✅ If admin provided new prices, update them
          const update = updatedItems?.find(u => u.itemId === item.id);
          const price = update ? update.newPrice * item.quantity : item.originalPrice * item.quantity;
          const unitPrice = update?.newPrice ?? item.originalPrice;
          const newTaxRate = update?.tax ? update.tax / 100 : item.taxRate;
          const tax = price * newTaxRate;
          // Calculate values
        const itemTotal = unitPrice * item.quantity;
        const itemTax = itemTotal * newTaxRate;

  await item.update({
    adjustedPrice: unitPrice,
    taxRate: newTaxRate, // Store updated tax rate
    taxAmount: tax
  }, { transaction });
          totalPrice += itemTotal;
          totalTax += itemTax;
        }
      }
  
      // ✅ Order is approved
      await order.update({ totalPrice, totalTax, status: 'approved' }, { transaction });

      await transaction?.commit();
      return await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'items' }]
      });
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
