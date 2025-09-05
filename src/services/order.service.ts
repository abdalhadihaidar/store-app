import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import Return from '../models/return.model';
import Store from '../models/store.model';
import { User } from '../models/user.model';
import { round2 } from '../utils/number.util';

export class OrderService {
  static async getAllOrders(requestingUserRole: string, storeId?: number) {
    const query: any = {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
        { model: User, as: 'user' },
        { model: Store, as: 'store' },
      ],
    };

    if (storeId) {
      query.where = { storeId };
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
  
      // ✅ Determine which userId to store
      const resolvedUserId =
        orderData.userId ?? (orderData.isPOS ? creatorId : null);

      if (!resolvedUserId) {
        throw new Error('userId is required for non-POS orders');
      }

      // ✅ Create the order
      const order = await Order.create(
        {
          userId: resolvedUserId,
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
          if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
            throw new Error('Package quantity must be a positive integer');
          }
          // snapshot of units for later but pricing based on packages
          quantity = item.quantity * product.numberperpackage;
          price = product.price * item.quantity; // price per package * packages
        } else {
          if (item.quantity <= 0) throw new Error('Quantity must be positive');
          price = product.price * item.quantity;
        }
        price = round2(price);
        const tax = round2(price * (taxRate / 100));
  
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
            taxAmount: tax,
            unitPerPackageSnapshot: product.numberperpackage,
          },
          { transaction }
        );
      }
  
      // ✅ Update order with correct price & tax
      await order.update({ totalPrice: round2(totalPrice), totalTax: round2(totalTax) }, { transaction });
  
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

  static async addItemToOrder(orderId: number, itemData: {
    productId: number;
    quantity: number;
    isPackage?: boolean;
    taxRate?: number;
  }) {
    const transaction = await Order.sequelize?.transaction();
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) throw new Error('Order not found');

      const product = await Product.findByPk(itemData.productId, { transaction });
      if (!product) throw new Error(`Product ${itemData.productId} not found`);

      const taxRate = itemData.taxRate ?? product.taxRate;
      let quantity = itemData.quantity;
      let price = 0;

      // Calculate price & quantity based on whether it's a package or unit
      if (itemData.isPackage) {
        if (itemData.quantity <= 0 || !Number.isInteger(itemData.quantity)) {
          throw new Error('Package quantity must be a positive integer');
        }
        quantity = itemData.quantity * product.numberperpackage;
        price = product.price * itemData.quantity;
      } else {
        if (itemData.quantity <= 0) throw new Error('Quantity must be positive');
        price = product.price * itemData.quantity;
      }

      price = round2(price);
      const tax = round2(price * (taxRate / 100));
      const packages = itemData.isPackage ? itemData.quantity : 0;

      // Create new OrderItem
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity: quantity,
        packages,
        originalPrice: product.price,
        adjustedPrice: null,
        taxRate,
        taxAmount: tax,
        unitPerPackageSnapshot: product.numberperpackage,
      }, { transaction });

      // Update order totals
      const newTotalPrice = round2(order.totalPrice + price);
      const newTotalTax = round2(order.totalTax + tax);
      
      await order.update({ 
        totalPrice: newTotalPrice, 
        totalTax: newTotalTax 
      }, { transaction });

      await transaction?.commit();
      return orderItem;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }

  static async removeItemFromOrder(orderId: number, itemId: number) {
    const transaction = await Order.sequelize?.transaction();
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) throw new Error('Order not found');

      const orderItem = await OrderItem.findByPk(itemId, { transaction });
      if (!orderItem || orderItem.orderId !== orderId) {
        throw new Error('Order item not found');
      }

      // Calculate the price and tax to subtract
      const priceToSubtract = orderItem.adjustedPrice ?? orderItem.originalPrice;
      const totalPriceToSubtract = priceToSubtract * orderItem.quantity;
      const taxToSubtract = orderItem.taxAmount;

      // Remove the order item
      await orderItem.destroy({ transaction });

      // Update order totals
      const newTotalPrice = round2(order.totalPrice - totalPriceToSubtract);
      const newTotalTax = round2(order.totalTax - taxToSubtract);
      
      await order.update({ 
        totalPrice: newTotalPrice, 
        totalTax: newTotalTax 
      }, { transaction });

      await transaction?.commit();
      return true;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }
}
