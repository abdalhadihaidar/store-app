
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import Return from '../models/return.model';
import Store from '../models/store.model';
import { User } from '../models/user.model';
import { round2 } from '../utils/number.util';

export class OrderService {
  static async getAllOrders(requestingUserRole: string, storeId?: number, page = 1, size = 25) {
    try {
      console.log('🔍 OrderService.getAllOrders called with:', { requestingUserRole, storeId, page, size });
      
      const limit = size;
      const offset = (page - 1) * size;
      
      // Use a more efficient approach: get orders first, then load items separately
      console.log('📊 Executing optimized query approach...');
      
      const baseQuery: any = {
        limit,
        offset,
        attributes: ['id', 'userId', 'storeId', 'status', 'totalPrice', 'totalTax', 'isPriceChangeRequested', 'isPOS', 'createdAt', 'updatedAt'],
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: Store, as: 'store', attributes: ['id', 'name', 'address', 'city'] },
        ],
        order: [['createdAt', 'DESC']],
      };

      if (storeId) {
        baseQuery.where = { storeId };
      }

      // Get orders with basic associations first
      const result = await Order.findAndCountAll(baseQuery);
      console.log('✅ Base query successful:', { count: result.count, rowsCount: result.rows.length });
      
      // Now load order items separately for each order to avoid complex joins
      if (result.rows.length > 0) {
        console.log('📦 Loading order items separately...');
        const orderIds = result.rows.map(order => order.id);
        
        const orderItems = await OrderItem.findAll({
          where: { orderId: orderIds },
          attributes: ['id', 'orderId', 'productId', 'quantity', 'packages', 'originalPrice', 'adjustedPrice', 'taxRate', 'taxAmount'],
          include: [{ 
            model: Product, 
            as: 'orderProduct', 
            attributes: ['id', 'name', 'price'] 
          }],
        });

        // Group items by orderId
        const itemsByOrderId = orderItems.reduce((acc, item) => {
          if (!acc[item.orderId]) {
            acc[item.orderId] = [];
          }
          acc[item.orderId].push(item);
          return acc;
        }, {} as Record<number, any[]>);

        // Attach items to orders
        result.rows.forEach(order => {
          (order as any).items = itemsByOrderId[order.id] || [];
        });
        
        console.log('✅ Order items loaded successfully');
      }
      
      console.log('✅ Complete query executed successfully:', { count: result.count, rowsCount: result.rows.length });
      return result;
      
    } catch (error) {
      console.error('❌ Error in OrderService.getAllOrders:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type',
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage
      });
      
      // If the optimized approach fails, try a minimal query
      console.log('🔄 Attempting minimal query as fallback...');
      try {
        const minimalQuery: any = {
          limit: size,
          offset: (page - 1) * size,
          attributes: ['id', 'userId', 'storeId', 'status', 'totalPrice', 'totalTax', 'isPriceChangeRequested', 'isPOS', 'createdAt', 'updatedAt'],
          order: [['createdAt', 'DESC']],
        };

        if (storeId) {
          minimalQuery.where = { storeId };
        }

        const minimalResult = await Order.findAndCountAll(minimalQuery);
        console.log('✅ Minimal query successful:', { count: minimalResult.count, rowsCount: minimalResult.rows.length });
        return minimalResult;
      } catch (minimalError) {
        console.error('❌ Even minimal query failed:', minimalError);
        throw error; // Throw the original error
      }
    }
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
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
      throw error;
    }
  }


  static async getOrderDetails(orderId: number) {
    try {
      console.log('🔍 getOrderDetails called for orderId:', orderId);
      
      // Step 1: Get basic order data only
      console.log('📋 Loading basic order data...');
      const order = await Order.findByPk(orderId, {
        attributes: ['id', 'userId', 'storeId', 'status', 'totalPrice', 'totalTax', 'isPriceChangeRequested', 'isPOS', 'createdAt', 'updatedAt']
      });
    
      if (!order) {
        throw new Error('Order not found');
      }
    
      if (!order.storeId) {
        throw new Error('Store is not associated to Order!');
      }

      // Step 2: Load store data separately
      console.log('🏪 Loading store data...');
      const store = await Store.findByPk(order.storeId, {
        attributes: ['id', 'name', 'address', 'city', 'postalCode']
      });

      // Step 3: Load user data separately
      console.log('👤 Loading user data...');
      const user = await User.findByPk(order.userId, {
        attributes: ['id', 'name', 'email']
      });

      // Step 4: Load order items separately
      console.log('📦 Loading order items...');
      const orderItems = await OrderItem.findAll({
        where: { orderId: orderId },
        attributes: ['id', 'orderId', 'productId', 'quantity', 'packages', 'originalPrice', 'adjustedPrice', 'taxRate', 'taxAmount', 'unitPerPackageSnapshot']
      });

      // Step 5: Load products for each item separately
      console.log('🛍️ Loading product data...');
      const productIds = orderItems.map(item => item.productId);
      console.log('📋 Product IDs to load:', productIds);
      const products = await Product.findAll({
        where: { id: productIds },
        attributes: ['id', 'name', 'price', 'numberperpackage']
      });
      console.log('✅ Loaded products:', products.length, 'products found');

      // Step 6: Load returns separately
      console.log('🔄 Loading returns data...');
      const returns = await Return.findAll({
        where: { orderId: orderId },
        attributes: ['id', 'orderId', 'orderItemId', 'userId', 'quantity', 'reason', 'status', 'createdAt', 'updatedAt']
      });

      // Step 7: Combine all data
      const productMap = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {} as Record<number, any>);

      const itemsWithProducts = orderItems.map(item => {
        const product = productMap[item.productId];
        return {
          ...item.dataValues,
          orderProduct: product ? product.dataValues : null,
          // Also include product data directly for easier frontend access
          product: product ? product.dataValues : null,
          productName: product ? product.name : 'N/A',
          productPrice: product ? product.price : 0
        };
      });

      // Create the final result object
      const result = {
        ...order.dataValues,
        store: store ? store.dataValues : null,
        user: user ? user.dataValues : null,
        items: itemsWithProducts,
        returns: returns.map(r => r.dataValues)
      };
      
      console.log('✅ Order details loaded successfully with', itemsWithProducts.length, 'items');
      console.log('📋 Sample item data:', itemsWithProducts[0] ? {
        id: itemsWithProducts[0].id,
        productId: itemsWithProducts[0].productId,
        productName: itemsWithProducts[0].productName,
        productPrice: itemsWithProducts[0].productPrice,
        hasOrderProduct: !!itemsWithProducts[0].orderProduct
      } : 'No items found');
      return result;
      
    } catch (error) {
      console.error('❌ Error in getOrderDetails:', error);
      
      // Fallback: try to get just the basic order data
      console.log('🔄 Attempting fallback with basic order data only...');
      try {
        const basicOrder = await Order.findByPk(orderId, {
          attributes: ['id', 'userId', 'storeId', 'status', 'totalPrice', 'totalTax', 'isPriceChangeRequested', 'isPOS', 'createdAt', 'updatedAt']
        });
        
        if (!basicOrder) {
          throw new Error('Order not found');
        }
        
        console.log('✅ Fallback successful - returning basic order data');
        return {
          ...basicOrder.dataValues,
          store: null,
          user: null,
          items: [],
          returns: []
        };
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
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
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
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
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
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
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
      throw error;
    }
  }


  /**
   * Get orders that can be converted to angebots (pending status)
   */
  static async getOrdersForAngebot(storeId?: number) {
    const where: any = {
      status: 'pending'
    };

    if (storeId) {
      where.storeId = storeId;
    }

    return await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: User, as: 'user' },
        { model: Store, as: 'store' }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Update adjusted prices for order items
   */
  static async updateAdjustedPrices(orderId: number, items: Array<{ itemId: number; adjustedPrice: number; taxRate?: number }>) {
    const transaction = await Order.sequelize?.transaction();
    try {
      console.log('🔧 Updating adjusted prices for order:', orderId);

      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Only pending orders can have adjusted prices');
      }

      let newTotalPrice = 0;
      let newTotalTax = 0;

      // Update each item's adjusted price
      for (const itemUpdate of items) {
        const orderItem = await OrderItem.findByPk(itemUpdate.itemId, { transaction });
        if (!orderItem || orderItem.orderId !== orderId) {
          throw new Error(`Order item ${itemUpdate.itemId} not found`);
        }

        const adjustedPrice = itemUpdate.adjustedPrice;
        const taxRate = itemUpdate.taxRate ?? orderItem.taxRate;
        const taxAmount = adjustedPrice * orderItem.quantity * (taxRate / 100);

        await orderItem.update({
          adjustedPrice: adjustedPrice,
          taxRate: taxRate,
          taxAmount: taxAmount
        }, { transaction });

        newTotalPrice += adjustedPrice * orderItem.quantity;
        newTotalTax += taxAmount;
      }

      // Update order totals
      await order.update({
        totalPrice: newTotalPrice,
        totalTax: newTotalTax
      }, { transaction });

      await transaction?.commit();
      
      console.log('✅ Adjusted prices updated successfully');
      return await this.getOrderDetails(orderId);
    } catch (error) {
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Create angebot from order with adjusted prices
   */
  static async createAngebotFromOrder(orderId: number, createdBy: number, validUntil?: Date, notes?: string) {
    try {
      console.log('📄 Creating angebot from order:', orderId);

      const order = await this.getOrderDetails(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Only pending orders can be converted to angebots');
      }

      // Check if order has adjusted prices
      const hasAdjustedPrices = order.items.some((item: any) => item.adjustedPrice !== null);
      if (!hasAdjustedPrices) {
        throw new Error('Order must have adjusted prices before creating angebot');
      }

      // Import AngebotService here to avoid circular dependency
      const { AngebotService } = await import('./angebot.service');
      
      const angebot = await AngebotService.createAngebotFromOrder(
        orderId,
        createdBy,
        validUntil,
        notes,
        order // Pass the order data we already have
      );

      console.log('✅ Angebot created successfully:', angebot.id);
      return angebot;
    } catch (error) {
      console.error('❌ Error creating angebot from order:', error);
      throw error;
    }
  }

  /**
   * Approve order after client accepts angebot
   */
  static async approveOrderFromAngebot(orderId: number, approvedBy: number) {
    const transaction = await Order.sequelize?.transaction();
    try {
      console.log('✅ Approving order from angebot:', orderId);

      const order = await Order.findByPk(orderId, { 
        transaction,
        include: [{ model: OrderItem, as: 'items' }]
      });
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Only pending orders can be approved');
      }

      // Update order status to approved
      await order.update({ status: 'approved' }, { transaction });

      await transaction?.commit();
      
      console.log('✅ Order approved successfully');
      return await this.getOrderDetails(orderId);
    } catch (error) {
      try {
        if (transaction) {
          await transaction.rollback();
        }
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
      throw error;
    }
  }
}
