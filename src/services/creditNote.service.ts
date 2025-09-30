import CreditNote from '../models/creditNote.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import Store from '../models/store.model';
import { generateCreditNotePdf, generatePaginatedCreditNotePdf } from '../utils/pdf.util';
import { OrderService } from './order.service';

export class CreditNoteService {
  static async regeneratePdf(creditNoteId: number): Promise<CreditNote | null> {
    try {
      console.log('🔄 Regenerating PDF for existing credit note:', creditNoteId);
      
      // Get the existing credit note
      const creditNote = await CreditNote.findByPk(creditNoteId, {
        include: [
          {
            model: Order,
            as: 'order',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name'] },
              { model: Store, as: 'store', attributes: ['id', 'name', 'address', 'city', 'postalCode'] },
              {
                model: require('../models/orderItem.model').default,
                as: 'items',
                include: [
                  { model: require('../models/product.model').default, as: 'product' }
                ]
              },
              {
                model: require('../models/return.model').default,
                as: 'returns'
              }
            ]
          }
        ]
      });

      if (!creditNote) {
        console.error('❌ Credit note not found:', creditNoteId);
        return null;
      }

      // Generate new PDF using existing credit note data
      const order = (creditNote as any).order;
      const items = order.items || [];
      const returns = order.returns || [];
      
      // Calculate refund and tax breakdown (same logic as create method)
      let refundAmount = 0;
      let totalNet = 0;
      let vat7 = 0;
      let vat19 = 0;
      
      returns.forEach((ret: any) => {
        const relatedItem = items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
        const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
        const taxRate = relatedItem?.taxRate || 0;
        const itemTotal = price * ret.quantity;
        refundAmount += itemTotal;
        totalNet += itemTotal / (1 + taxRate);
        
        if (Math.abs(taxRate - 0.07) < 0.01) {
          vat7 += itemTotal - (itemTotal / 1.07);
        } else if (Math.abs(taxRate - 0.19) < 0.01) {
          vat19 += itemTotal - (itemTotal / 1.19);
        }
      });
      
      const totalGross = totalNet + vat7 + vat19;
      
      const templateData = {
        storeName: order.store?.name,
        userName: order.user?.name,
        storeAddress: order.store?.address,
        storeCity: order.store?.city,
        storePostalCode: order.store?.postalCode,
        creditNumber: creditNote.number,
        orderId: order.id,
        creditDate: creditNote.date.toLocaleDateString('de-DE'),
        kundenNr: order.userId,
        currentPage: 1, // Default to page 1
        items: returns.map((ret: any) => {
          const relatedItem = items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
          const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
          const taxRate = relatedItem?.taxRate || 0;
          const ratePercent = taxRate < 1 ? taxRate * 100 : taxRate;
          
          return {
            id: ret.orderItemId,
            name: relatedItem?.orderProduct?.name || ret.orderItemId,
            quantity: ret.quantity,
            price: price,
            total: price * ret.quantity,
            taxRate: ratePercent,
            taxAmount: (price * ret.quantity) - ((price * ret.quantity) / (1 + taxRate))
          };
        }),
        totalNet,
        vat7,
        vat19,
        totalGross,
        isLastPage: true // Always show bank details for credit notes
      };
      
      // Calculate items per page (same as invoice service)
      const ITEMS_PER_PAGE = 20;
      
      // Process returns to include packages calculation
      const processedReturns = templateData.items.map((ret: any) => {
        const relatedItem = items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
        const packages = Math.ceil(ret.quantity / (relatedItem?.unitPerPackageSnapshot || 1));
        
        return {
          ...ret,
          packages: packages,
          numberPerPackage: relatedItem?.unitPerPackageSnapshot || 1
        };
      });
      
      const updatedTemplateData = {
        ...templateData,
        returns: processedReturns
      };
      
      const result = await generatePaginatedCreditNotePdf(order, updatedTemplateData, ITEMS_PER_PAGE);
      
      if (result && result.filePath) {
        // Update the credit note with the new PDF path
        creditNote.pdfPath = result.filePath;
        await creditNote.save();
        
        console.log('✅ Credit note PDF regenerated successfully:', result.filePath);
        return creditNote;
      } else {
        console.error('❌ Failed to generate PDF for credit note:', creditNoteId);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error regenerating credit note PDF:', error);
      return null;
    }
  }

  /**
   * Generate a credit note for an order's returns and store it.
   */
  static async create(orderId: number, createdBy: number | null = null) {
    const order = await OrderService.getOrderDetails(orderId);

    // Check if there are any returns for this order
    if (!order.returns || order.returns.length === 0) {
      throw new Error('No returns found for this order. Cannot create credit note without returns.');
    }

    // Calculate refund and tax breakdown
    let refundAmount = 0;
    let totalNet = 0;
    let vat7 = 0;
    let vat19 = 0;
    
    (order.returns || []).forEach(ret => {
      const relatedItem = (order.items || []).find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
      const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0; // E-Preis (price per piece)
      const taxRate = relatedItem?.taxRate || 0;
      
      // Calculate return quantity in packets
      const returnPackages = ret.quantity / (relatedItem?.unitPerPackageSnapshot || 1);
      const itemTotal = price * returnPackages; // Packet-based calculation
      const itemTaxAmount = itemTotal * (taxRate / 100);
      
      totalNet += itemTotal;
      if (taxRate === 7) {
        vat7 += itemTaxAmount;
      } else if (taxRate === 19) {
        vat19 += itemTaxAmount;
      }
      refundAmount += itemTotal;
    });
    
    const totalGross = totalNet + vat7 + vat19;

    const templateData = {
      storeName: order.store?.name,
      userName: order.user?.name,
      storeAddress: order.store?.address,
      storeCity: order.store?.city,
      storePostalCode: order.store?.postalCode,
      creditNumber: `CRN-${Date.now()}`,
      orderId: order.id,
      creditDate: new Date().toLocaleDateString('de-DE'),
      kundenNr: order.userId,
      currentPage: 1, // Default to page 1
      returns: (order.returns || []).map(ret => {
        const relatedItem = (order.items || []).find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
        const name = (relatedItem as any)?.product?.name || relatedItem?.productId || ret.orderItemId;
        const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0; // E-Preis (price per piece)
        const taxRate = relatedItem?.taxRate || 0;
        
        // Calculate return quantity in packets
        const returnPackages = ret.quantity / (relatedItem?.unitPerPackageSnapshot || 1);
        const itemTaxAmount = price * returnPackages * (taxRate / 100);
        const tax7 = taxRate === 7 ? itemTaxAmount : 0;
        const tax19 = taxRate === 19 ? itemTaxAmount : 0;
        const total = price * returnPackages; // Packet-based total
        
        return {
          id: relatedItem?.productId || ret.orderItemId,
          name,
          packages: returnPackages, // Return quantity in packets
          numberPerPackage: relatedItem?.unitPerPackageSnapshot || 0,
          quantity: ret.quantity, // Total pieces returned
          price: price, // E-Preis (price per piece)
          total: total,
          tax7: tax7,
          tax19: tax19,
          amount: total,
        };
      }).filter(ret => ret.quantity > 0), // Filter out zero quantity returns
      refundAmount,
      totalNet,
      vat7,
      vat19,
      totalGross,
      isLastPage: true // Always show bank details for credit notes
    };

    // Calculate items per page (same as invoice service)
    const ITEMS_PER_PAGE = 20;
    
    // Process returns to include packages calculation
    const processedReturns = templateData.returns.map((ret: any) => {
      const relatedItem = order.items.find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
      const packages = Math.ceil(ret.quantity / (relatedItem?.unitPerPackageSnapshot || 1));
      
      return {
        ...ret,
        packages: packages,
        numberPerPackage: relatedItem?.unitPerPackageSnapshot || 1
      };
    });
    
    const updatedTemplateData = {
      ...templateData,
      returns: processedReturns
    };

    const { filePath } = await generatePaginatedCreditNotePdf(order, updatedTemplateData, ITEMS_PER_PAGE);

    const credit = await CreditNote.create({
      orderId: order.id,
      number: templateData.creditNumber,
      date: new Date(),
      totalNet: refundAmount,
      totalVat: 0,
      totalGross: refundAmount,
      pdfPath: filePath,
      createdBy,
    });

    return credit;
  }

  /**
   * Get paginated credit notes list
   */
  static async getAll(page = 1, size = 25) {
    const limit = size;
    const offset = (page - 1) * size;

    return await CreditNote.findAndCountAll({
      limit,
      offset,
      attributes: ['id', 'orderId', 'number', 'date', 'totalGross', 'totalNet', 'totalVat', 'createdAt'],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'status', 'totalPrice', 'totalTax', 'storeId', 'userId'],
          include: [
            { model: User, as: 'user', attributes: ['id', 'name'] },
            { model: Store, as: 'store', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getById(id: number) {
    const credit = await CreditNote.findByPk(id, { 
      include: [
        { 
          model: Order, 
          as: 'order',
          include: [
            { model: User, as: 'user' },
            { model: Store, as: 'store' }
          ]
        }
      ] 
    });
    if (!credit) throw new Error('Credit note not found');
    return credit;
  }

  static async update(id: number, updates: Partial<CreditNote>) {
    const credit = await CreditNote.findByPk(id);
    if (!credit) throw new Error('Credit note not found');
    await credit.update(updates);
    return credit;
  }

  static async delete(id: number) {
    const credit = await CreditNote.findByPk(id);
    if (!credit) throw new Error('Credit note not found');
    await credit.destroy();
  }
}
