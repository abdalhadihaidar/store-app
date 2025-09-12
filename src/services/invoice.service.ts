import Invoice from '../models/invoice.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import Store from '../models/store.model';
import { generateInvoicePdf } from '../utils/pdf.util';
import { OrderService } from './order.service';
import { addGermanFieldsToOrderItem } from '../utils/germanBusiness.util';

interface PrintData {
  invoiceNumber?: string;
  invoiceDate?: string;
  userName?: string;
  kundenNr?: string;
}

export class InvoiceService {
  static async create(orderId: number, createdBy: number | null = null, printData: PrintData = {}) {
    // Fetch order with associations
    const order = await OrderService.getOrderDetails(orderId);

    const vat7Sum = (order.items || []).reduce((acc, i) => {
      const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
      return Math.abs(rp - 7) < 0.01 ? acc + i.taxAmount : acc;
    }, 0);
    const vat19Sum = (order.items || []).reduce((acc, i) => {
      const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
      return Math.abs(rp - 19) < 0.01 ? acc + i.taxAmount : acc;
    }, 0);

    const templateData = {
      storeName: order.store?.name,
      userName: printData?.userName || order.user?.name,
      storeAddress: order.store?.address,
      storeCity: order.store?.city,
      storePostalCode: order.store?.postalCode,
      invoiceNumber: printData?.invoiceNumber || `INV-${Date.now()}`,
      orderId: order.id,
      invoiceDate: printData?.invoiceDate || new Date().toLocaleDateString('de-DE'),
      kundenNr: printData?.kundenNr || order.userId,
      items: (order.items || []).map(i => {
        const ratePercent = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
        const baseItem = {
          id: i.productId,
          name: (i as any).product?.name || i.productId,
          packages: i.packages,
          numberPerPackage: (i as any).product?.numberperpackage || 0,
          quantity: i.quantity,
          price: i.adjustedPrice ?? i.originalPrice, // use store-adjusted price if available
          adjustedPrice: i.adjustedPrice,
          total: (i.adjustedPrice ?? i.originalPrice) * i.quantity,
          tax7: Math.abs(ratePercent - 7) < 0.01 ? i.taxAmount : 0,
          tax19: Math.abs(ratePercent - 19) < 0.01 ? i.taxAmount : 0,
        };
        
        // Add German business terminology
        return addGermanFieldsToOrderItem(baseItem);
      }),
      totalNet: order.totalPrice,
      vat7: vat7Sum,
      vat19: vat19Sum,
      totalGross: order.totalPrice + order.totalTax
    };

    const { filePath } = await generateInvoicePdf(order, templateData);

    // Compute totals (already on order)
    const invoice = await Invoice.create({
      orderId: order.id,
      number: printData?.invoiceNumber || `INV-${Date.now()}`,
      date: new Date(),
      totalNet: order.totalPrice,
      totalVat: order.totalTax,
      totalGross: order.totalPrice + order.totalTax,
      pdfPath: filePath,
      createdBy,
    });

    return invoice;
  }

  /**
   * Get paginated invoices list
   * @param page   1-based page number
   * @param size   items per page
   */
  static async getAll(page = 1, size = 25) {
    const limit = size;
    const offset = (page - 1) * size;

    return await Invoice.findAndCountAll({
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
    const invoice = await Invoice.findByPk(id, { 
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
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  static async update(id: number, updates: Partial<Invoice>) {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) throw new Error('Invoice not found');
    await invoice.update(updates);
    return invoice;
  }

  static async delete(id: number) {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) throw new Error('Invoice not found');
    await invoice.destroy();
  }
}
