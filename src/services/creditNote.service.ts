import CreditNote from '../models/creditNote.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import Store from '../models/store.model';
import { generateCreditNotePdf } from '../utils/pdf.util';
import { OrderService } from './order.service';

export class CreditNoteService {
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
      const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
      const taxRate = relatedItem?.taxRate || 0;
      const itemTotal = price * ret.quantity;
      const itemTaxAmount = relatedItem?.taxAmount || 0;
      
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
      returns: (order.returns || []).map(ret => {
        const relatedItem = (order.items || []).find((i: any) => i.id === ret.orderItemId || i.productId === ret.orderItemId);
        const name = (relatedItem as any)?.product?.name || relatedItem?.productId || ret.orderItemId;
        const price = relatedItem ? relatedItem.adjustedPrice ?? relatedItem.originalPrice : 0;
        const taxRate = relatedItem?.taxRate || 0;
        const itemTaxAmount = relatedItem?.taxAmount || 0;
        const tax7 = taxRate === 7 ? itemTaxAmount : 0;
        const tax19 = taxRate === 19 ? itemTaxAmount : 0;
        const total = price * ret.quantity;
        
        return {
          id: relatedItem?.productId || ret.orderItemId,
          name,
          packages: relatedItem?.packages || 0,
          numberPerPackage: relatedItem?.unitPerPackageSnapshot || 0,
          quantity: ret.quantity,
          price: price,
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
    };

    const { filePath } = await generateCreditNotePdf(order, templateData);

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

  static async getAll() {
    return await CreditNote.findAll({ 
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
