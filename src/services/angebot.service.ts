import { Transaction, Op } from 'sequelize';
import sequelize from '../config/database';
import Angebot from '../models/angebot.model';
import AngebotItemModel from '../models/angebotItem.model';
import Order from '../models/order.model';
import OrderItem from '../models/orderItem.model';
import Product from '../models/product.model';
import { User } from '../models/user.model';
import Store from '../models/store.model';
import { generateAngebotPdf, generatePaginatedAngebotPdf } from '../utils/pdf.util';
import { addGermanFieldsToOrderItem } from '../utils/germanBusiness.util';

export class AngebotService {
  /**
   * Generate unique angebot number
   */
  static async generateAngebotNumber(storeId: number): Promise<string> {
    const currentYear = new Date().getFullYear();
    const store = await Store.findByPk(storeId);
    const storeCode = store?.name?.substring(0, 3).toUpperCase() || 'STO';
    
    // Find the last angebot number for this store and year
    const lastAngebot = await Angebot.findOne({
      where: {
        storeId,
        angebotNumber: {
          [Op.like]: `${currentYear}-${storeCode}-%`
        }
      },
      order: [['angebotNumber', 'DESC']]
    });

    let sequence = 1;
    if (lastAngebot) {
      const lastSequence = parseInt(lastAngebot.angebotNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${currentYear}-${storeCode}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Create a new angebot from an order
   */
  static async createAngebotFromOrder(
    orderId: number,
    createdBy: number,
    validUntil?: Date,
    notes?: string,
    orderData?: any
  ): Promise<Angebot> {
    console.log('📄 Creating angebot from order:', orderId);
    
    let transaction: any = null;
    
    try {
      let order = orderData;
      
      // If order data is not provided, fetch it
      if (!order) {
        console.log('📋 Fetching order data...');
        order = await Order.findByPk(orderId, {
          include: [
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'orderProduct' }] },
            { model: Store, as: 'store' }
          ]
        });
      }

      if (!order) {
        throw new Error('Order not found');
      }

      console.log('✅ Order data ready, starting transaction...');
      
      // Test connection before starting transaction
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');
      } catch (authError) {
        console.error('❌ Database connection failed:', authError);
        throw new Error('Database connection failed');
      }
      
      // Start transaction after we have the order data
      transaction = await sequelize.transaction();
      
      // Generate angebot number
      const angebotNumber = await this.generateAngebotNumber(order.storeId);

      // Set default validity period (30 days from now)
      const defaultValidUntil = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create angebot
      const angebot = await Angebot.create({
        orderId,
        angebotNumber,
        date: new Date(),
        validUntil: defaultValidUntil,
        status: 'draft',
        totalNet: 0,
        totalVat: 0,
        totalGross: 0,
        notes: notes || null,
        createdBy,
        storeId: order.storeId,
        customerId: order.userId
      }, { transaction });

      // Create angebot items from order items
      let totalNet = 0;
      let totalVat = 0;

      for (const orderItem of order.items || []) {
        const unitPrice = orderItem.adjustedPrice || orderItem.originalPrice; // E-Preis (price per piece)
        const taxAmount = unitPrice * orderItem.quantity * (orderItem.taxRate / 100); // Tax on piece-based price
        const itemTotal = (unitPrice * orderItem.quantity) + taxAmount; // Piece-based total

        await AngebotItemModel.create({
          angebotId: angebot.id,
          productId: orderItem.productId,
          quantity: orderItem.quantity, // Total pieces (calculated)
          packages: orderItem.packages, // Number of packets (can be fractional)
          unitPrice, // E-Preis (price per piece)
          taxRate: orderItem.taxRate,
          taxAmount,
          totalPrice: itemTotal,
          unitPerPackageSnapshot: orderItem.unitPerPackageSnapshot || 1
        }, { transaction });

        totalNet += unitPrice * orderItem.packages; // Packet-based net calculation
        totalVat += taxAmount;
      }

      // Update angebot totals
      await angebot.update({
        totalNet,
        totalVat,
        totalGross: totalNet + totalVat
      }, { transaction });

      // Commit transaction
      await transaction.commit();
      transaction = null; // Mark as committed
      
      console.log('✅ Angebot created successfully with ID:', angebot.id);
      
      // Generate PDF after successful creation (without transaction)
      try {
        console.log('📄 Generating angebot PDF...');
        console.log('📄 Angebot data:', JSON.stringify(angebot.toJSON(), null, 2));
        console.log('📄 Order data:', JSON.stringify(order, null, 2));
        console.log('📄 Items data:', JSON.stringify(order.items || [], null, 2));
        
        // Calculate items per page (same as invoice service)
        const ITEMS_PER_PAGE = 20;
        
        // Process items to include packages calculation
        const processedItems = (order.items || []).map(i => {
          const ratePercent = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
          const packages = Math.ceil(i.quantity / (i.unitPerPackageSnapshot || 1));
          
          return {
            id: i.id,
            name: i.orderProduct?.name || 'N/A',
            productName: i.orderProduct?.name || 'N/A',
            quantity: i.quantity,
            unitPerPackageSnapshot: i.unitPerPackageSnapshot || 1,
            packages: packages,
            adjustedPrice: i.adjustedPrice,
            originalPrice: i.originalPrice,
            taxRate: ratePercent,
            orderProduct: i.orderProduct
          };
        });
        
        const pdfResult = await generatePaginatedAngebotPdf(angebot, order, processedItems, ITEMS_PER_PAGE);
        console.log('✅ Angebot PDF generated:', pdfResult.filePath);
        
        // Update angebot with PDF path (without transaction)
        await angebot.update({ pdfPath: pdfResult.filePath });
        console.log('✅ PDF path updated in database');
      } catch (pdfError: any) {
        console.error('❌ Error generating angebot PDF:', pdfError);
        console.error('❌ PDF Error details:', {
          message: pdfError?.message || 'Unknown error',
          stack: pdfError?.stack || 'No stack trace',
          name: pdfError?.name || 'Unknown error type'
        });
        // Don't fail the entire operation if PDF generation fails
      }
      
      // Return the angebot with updated PDF path (avoid complex re-query that causes connection issues)
      await angebot.reload(); // Reload to get the updated pdfPath
      return angebot;
      
    } catch (error) {
      console.error('❌ Error creating angebot:', error);
      
      // Only rollback if transaction is still active
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('✅ Transaction rolled back successfully');
        } catch (rollbackError) {
          console.error('❌ Error during transaction rollback:', rollbackError);
        }
      }
      throw error;
    }
  }

  /**
   * Create a new angebot directly (not from an order)
   */
  static async createDirectAngebot(
    customerId: number,
    storeId: number,
    items: Array<{
      productId: number;
      quantity: number;
      packages?: number;
      unitPrice: number;
      taxRate?: number;
    }>,
    createdBy: number,
    validUntil?: Date,
    notes?: string
  ): Promise<Angebot> {
    const transaction = await sequelize.transaction();
    
    try {
      // Generate angebot number
      const angebotNumber = await this.generateAngebotNumber(storeId);

      // Set default validity period (30 days from now)
      const defaultValidUntil = validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create angebot
      const angebot = await Angebot.create({
        angebotNumber,
        date: new Date(),
        validUntil: defaultValidUntil,
        status: 'draft',
        totalNet: 0,
        totalVat: 0,
        totalGross: 0,
        notes,
        createdBy,
        storeId,
        customerId
      }, { transaction });

      // Create angebot items
      let totalNet = 0;
      let totalVat = 0;

      for (const item of items) {
        const taxRate = item.taxRate || 0.15; // Default 15% tax
        const taxAmount = item.unitPrice * item.quantity * taxRate;
        const itemTotal = (item.unitPrice * item.quantity) + taxAmount;

        await AngebotItemModel.create({
          angebotId: angebot.id,
          productId: item.productId,
          quantity: item.quantity,
          packages: item.packages || 0,
          unitPrice: item.unitPrice,
          taxRate,
          taxAmount,
          totalPrice: itemTotal,
          unitPerPackageSnapshot: 1 // Default value for direct angebots
        }, { transaction });

        totalNet += item.unitPrice * item.quantity;
        totalVat += taxAmount;
      }

      // Update angebot totals
      await angebot.update({
        totalNet,
        totalVat,
        totalGross: totalNet + totalVat
      }, { transaction });

      await transaction.commit();
      // Return the angebot directly (avoid complex re-query that causes connection issues)
      return angebot;
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
   * Get angebot by ID with all related data
   */
  static async getAngebotById(angebotId: number): Promise<Angebot | null> {
    const angebot = await Angebot.findByPk(angebotId, {
      include: [
        { model: AngebotItemModel, as: 'items', include: [{ model: Product, as: 'angebotProduct' }] },
        { model: Order, as: 'order' },
        { model: User, as: 'customer' },
        { model: Store, as: 'store' }
      ]
    });

    if (!angebot) return null;

    // Add German business terminology to angebot items
    const angebotWithGermanFields = {
      ...angebot.toJSON(),
      items: angebot.items?.map(item => addGermanFieldsToOrderItem(item.toJSON()))
    };

    return angebotWithGermanFields as any;
  }

  /**
   * Get basic angebot data by ID (for PDF download - avoids complex joins)
   */
  static async getBasicAngebotById(angebotId: number): Promise<Angebot | null> {
    return await Angebot.findByPk(angebotId, {
      attributes: ['id', 'angebotNumber', 'pdfPath']
    });
  }

  /**
   * Get all angebots with filtering
   */
  static async getAllAngebots(
    storeId?: number,
    status?: string,
    customerId?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ angebots: any[]; total: number; totalPages: number }> {
    const where: any = {};
    
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const offset = (page - 1) * limit;

    try {
      // First, get the basic angebot data without complex joins
      const { count, rows } = await Angebot.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Then, for each angebot, load the related data separately to avoid complex joins
      const angebotsWithRelations = await Promise.all(
        rows.map(async (angebot) => {
          try {
            // Load customer and store data separately
            const [customer, store] = await Promise.all([
              angebot.customerId ? User.findByPk(angebot.customerId) : null,
              angebot.storeId ? Store.findByPk(angebot.storeId) : null
            ]);

            // Return angebot with related data
            return {
              ...angebot.toJSON(),
              customer,
              store
            };
          } catch (error) {
            console.error(`Error loading relations for angebot ${angebot.id}:`, error);
            // Return angebot without relations if there's an error
            return {
              ...angebot.toJSON(),
              customer: null,
              store: null
            };
          }
        })
      );

      return {
        angebots: angebotsWithRelations,
        total: count,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Error in getAllAngebots:', error);
      throw error;
    }
  }

  /**
   * Update angebot item prices, quantities, and taxes
   */
  static async updateAngebotItems(
    angebotId: number,
    items: Array<{
      itemId: number;
      quantity?: number;
      unitPrice?: number;
      taxRate?: number;
      packages?: number;
    }>,
    updatedBy: number
  ): Promise<Angebot> {
    const transaction = await sequelize.transaction();
    
    try {
      const angebot = await Angebot.findByPk(angebotId, { transaction });
      if (!angebot) {
        throw new Error('Angebot not found');
      }

      let totalNet = 0;
      let totalVat = 0;

      for (const itemUpdate of items) {
        const angebotItem = await AngebotItemModel.findByPk(itemUpdate.itemId, { transaction });
        if (!angebotItem || angebotItem.angebotId !== angebotId) {
          throw new Error('Angebot item not found');
        }

        // Update item properties
        const updates: any = {};
        if (itemUpdate.quantity !== undefined) updates.quantity = itemUpdate.quantity;
        if (itemUpdate.unitPrice !== undefined) updates.unitPrice = itemUpdate.unitPrice;
        if (itemUpdate.taxRate !== undefined) updates.taxRate = itemUpdate.taxRate;
        if (itemUpdate.packages !== undefined) updates.packages = itemUpdate.packages;

        await angebotItem.update(updates, { transaction });

        // Recalculate totals (packet-based)
        const packages = updates.packages !== undefined ? updates.packages : angebotItem.packages;
        const unitPrice = updates.unitPrice || angebotItem.unitPrice; // E-Preis (price per piece)
        const taxRate = updates.taxRate || angebotItem.taxRate;
        
        // Calculate quantity from packages
        const quantity = packages * (angebotItem.unitPerPackageSnapshot || 1);
        
        const taxAmount = unitPrice * quantity * (taxRate / 100); // Tax on piece-based price
        const itemTotal = (unitPrice * quantity) + taxAmount; // Piece-based total

        await angebotItem.update({
          quantity, // Update calculated quantity
          taxAmount,
          totalPrice: itemTotal
        }, { transaction });

        totalNet += unitPrice * packages; // Packet-based net calculation
        totalVat += taxAmount;
      }

      // Update angebot totals
      await angebot.update({
        totalNet,
        totalVat,
        totalGross: totalNet + totalVat,
        updatedBy
      }, { transaction });

      await transaction.commit();
      const result = await this.getAngebotById(angebotId);
      if (!result) throw new Error('Failed to retrieve updated angebot');
      return result;
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
   * Update angebot status
   */
  static async updateAngebotStatus(
    angebotId: number,
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired',
    updatedBy: number
  ): Promise<Angebot> {
    const angebot = await Angebot.findByPk(angebotId);
    if (!angebot) {
      throw new Error('Angebot not found');
    }

    await angebot.update({ status, updatedBy });
    const result = await this.getAngebotById(angebotId);
    if (!result) throw new Error('Failed to retrieve updated angebot');
    return result;
  }

  /**
   * Convert accepted angebot to order
   */
  static async convertAngebotToOrder(
    angebotId: number,
    createdBy: number
  ): Promise<Order> {
    const transaction = await sequelize.transaction();
    
    try {
      const angebot = await Angebot.findByPk(angebotId, {
        include: [
          { model: AngebotItemModel, as: 'items', include: [{ model: Product, as: 'product' }] }
        ],
        transaction
      });

      if (!angebot) {
        throw new Error('Angebot not found');
      }

      if (angebot.status !== 'accepted') {
        throw new Error('Only accepted angebots can be converted to orders');
      }

      // Create order
      const order = await Order.create({
        userId: angebot.customerId,
        storeId: angebot.storeId,
        status: 'approved', // Directly approved since customer already accepted
        totalPrice: angebot.totalGross,
        totalTax: angebot.totalVat,
        isPriceChangeRequested: false,
        isPOS: false
      }, { transaction });

      // Create order items from angebot items
      for (const angebotItem of angebot.items || []) {
        await OrderItem.create({
          orderId: order.id,
          productId: angebotItem.productId,
          quantity: angebotItem.quantity,
          packages: angebotItem.packages,
          originalPrice: angebotItem.unitPrice,
          adjustedPrice: angebotItem.unitPrice,
          taxRate: angebotItem.taxRate,
          taxAmount: angebotItem.taxAmount,
          unitPerPackageSnapshot: angebotItem.unitPerPackageSnapshot || 1
        }, { transaction });
      }

      // Update angebot to link with the new order
      await angebot.update({ orderId: order.id }, { transaction });

      await transaction.commit();
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

  /**
   * Delete angebot (only if draft or expired)
   */
  static async deleteAngebot(angebotId: number): Promise<boolean> {
    const transaction = await sequelize.transaction();
    
    try {
      const angebot = await Angebot.findByPk(angebotId, { transaction });
      if (!angebot) {
        throw new Error('Angebot not found');
      }

      if (!['draft', 'expired'].includes(angebot.status)) {
        throw new Error('Only draft or expired angebots can be deleted');
      }

      // First delete all angebot items to avoid foreign key constraint
      await AngebotItemModel.destroy({
        where: { angebotId },
        transaction
      });

      // Then delete the angebot
      await angebot.destroy({ transaction });

      await transaction.commit();
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
}
