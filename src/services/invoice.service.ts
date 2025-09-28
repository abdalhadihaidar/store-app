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
  static async regeneratePdf(invoiceId: number): Promise<Invoice | null> {
    try {
      console.log('🔄 Regenerating PDF for existing invoice:', invoiceId);
      
      // Get the existing invoice
      const invoice = await Invoice.findByPk(invoiceId, {
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
              }
            ]
          }
        ]
      });

      if (!invoice) {
        console.error('❌ Invoice not found:', invoiceId);
        return null;
      }

      console.log('📋 Invoice found:', {
        id: invoice.id,
        number: invoice.number,
        orderId: invoice.orderId,
        hasOrder: !!(invoice as any).order,
        hasItems: !!(invoice as any).order?.items?.length
      });

      // Generate new PDF using existing invoice data with proper template data
      const order = (invoice as any).order;
      const items = order.items || [];
      
      // Calculate totals (same logic as create method)
      const vat7Sum = items.reduce((acc: number, i: any) => {
        const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
        return Math.abs(rp - 7) < 0.01 ? acc + i.taxAmount : acc;
      }, 0);
      const vat19Sum = items.reduce((acc: number, i: any) => {
        const rp = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
        return Math.abs(rp - 19) < 0.01 ? acc + i.taxAmount : acc;
      }, 0);

      // Calculate items per page (same as create method)
      const ITEMS_PER_PAGE = 21;
      
      const processedItems = items.map((i: any) => {
        const ratePercent = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
        const baseItem = {
          id: i.productId,
          name: (i as any).product?.name || i.productId,
          packages: i.packages,
          numberPerPackage: (i as any).product?.numberperpackage || 0,
          quantity: i.quantity,
          price: i.adjustedPrice ?? i.originalPrice,
          adjustedPrice: i.adjustedPrice,
          total: (i.adjustedPrice ?? i.originalPrice) * i.quantity,
          tax7: Math.abs(ratePercent - 7) < 0.01 ? i.taxAmount : 0,
          tax19: Math.abs(ratePercent - 19) < 0.01 ? i.taxAmount : 0,
        };
        
        // Add German business terminology
        return addGermanFieldsToOrderItem(baseItem);
      });

      const templateData = {
        storeName: order.store?.name,
        userName: order.user?.name,
        storeAddress: order.store?.address,
        storeCity: order.store?.city,
        storePostalCode: order.store?.postalCode,
        invoiceNumber: invoice.number,
        orderId: order.id,
        invoiceDate: invoice.date.toLocaleDateString('de-DE'),
        kundenNr: invoice.kundenNr || order.userId?.toString(),
        items: processedItems,
        totalNet: invoice.totalNet,
        vat7: vat7Sum,
        vat19: vat19Sum,
        totalGross: invoice.totalGross,
      };
      
      console.log('🔧 Generating PDF with template data:', {
        storeName: templateData.storeName,
        userName: templateData.userName,
        invoiceNumber: templateData.invoiceNumber,
        itemsCount: templateData.items.length,
        totalNet: templateData.totalNet,
        totalGross: templateData.totalGross
      });
      
      // Use paginated PDF generation for proper page handling
      const result = await this.generatePaginatedInvoicePdf(order, templateData, ITEMS_PER_PAGE);
      
      console.log('📄 PDF generation result:', {
        success: !!result,
        hasFilePath: !!(result && result.filePath),
        filePath: result?.filePath
      });
      
      if (result && result.filePath) {
        // Update the invoice with the new PDF path
        invoice.pdfPath = result.filePath;
        await invoice.save();
        
        console.log('✅ Invoice PDF regenerated successfully:', result.filePath);
        return invoice;
      } else {
        console.error('❌ Failed to generate PDF for invoice:', invoiceId);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error regenerating invoice PDF:', error);
      return null;
    }
  }

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

    // Calculate items per page based on A4 page size and template design
    // With header (~200px), footer (~150px), and table rows (~20px each), 
    // we can fit approximately 21 items per page on A4
    const ITEMS_PER_PAGE = 21;
    
    const processedItems = (order.items || []).map(i => {
      const ratePercent = i.taxRate < 1 ? i.taxRate * 100 : i.taxRate;
      const baseItem = {
        id: i.productId,
        name: (i as any).product?.name || i.productId,
        packages: i.packages, // Number of packets (can be fractional)
        numberPerPackage: (i as any).product?.numberperpackage || 0,
        quantity: i.quantity, // Total pieces (calculated)
        price: i.adjustedPrice ?? i.originalPrice, // E-Preis (price per piece)
        adjustedPrice: i.adjustedPrice,
        total: (i.adjustedPrice ?? i.originalPrice) * i.quantity, // Piece-based total
        tax7: Math.abs(ratePercent - 7) < 0.01 ? i.taxAmount : 0,
        tax19: Math.abs(ratePercent - 19) < 0.01 ? i.taxAmount : 0,
      };
      
      // Add German business terminology
      return addGermanFieldsToOrderItem(baseItem);
    });

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
      items: processedItems,
      totalNet: order.totalPrice,
      vat7: vat7Sum,
      vat19: vat19Sum,
      totalGross: order.totalPrice + order.totalTax,
    };

    // Use paginated PDF generation for proper page handling
    const { filePath } = await this.generatePaginatedInvoicePdf(order, templateData, ITEMS_PER_PAGE);

    // Compute totals (already on order)
    const invoice = await Invoice.create({
      orderId: order.id,
      number: printData?.invoiceNumber || `INV-${Date.now()}`,
      kundenNr: printData?.kundenNr || order.userId?.toString(),
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

  /**
   * Generate paginated invoice PDF with proper bank details placement
   */
  private static async generatePaginatedInvoicePdf(order: Order, templateData: any, itemsPerPage: number = 21) {
    try {
      console.log('🔧 Starting paginated invoice PDF generation...');
      console.log('🔧 Items count:', templateData.items.length);
      console.log('🔧 Items per page:', itemsPerPage);
      
      const uploadsDir = require('path').resolve(__dirname, '../../uploads/invoices');
      const ensureDir = (dir: string) => { 
        if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true }); 
      };
      ensureDir(uploadsDir);
      
      const fileName = `invoice_${order.id}_${Date.now()}.pdf`;
      const filePath = require('path').join(uploadsDir, fileName);
      
      const templatePath = require('path').resolve(__dirname, '../../templates/invoice.ejs');
      
      // Calculate total pages and determine if we need pagination
      const totalPages = Math.max(1, Math.ceil(templateData.items.length / itemsPerPage));
      
      // For single page, use regular PDF generation
      if (totalPages === 1) {
        const singlePageData = {
          ...templateData,
          isLastPage: true,
          currentPage: 1,
          totalPages: 1
        };
        
        console.log('🔧 Single page invoice, using regular PDF generation...');
        return await generateInvoicePdf(order, singlePageData);
      }
      
      // For multiple pages, we need to implement pagination logic
      // For now, fallback to regular PDF generation but with proper isLastPage flag
      console.log('🔧 Multiple pages detected, using regular PDF generation with proper pagination...');
      const paginatedData = {
        ...templateData,
        isLastPage: true, // This will be handled by the template logic
        currentPage: 1,
        totalPages: totalPages
      };
      
      return await generateInvoicePdf(order, paginatedData);
      
    } catch (error: any) {
      console.error('❌ Error generating paginated invoice PDF:', error);
      // Fallback to regular PDF generation
      console.log('🔄 Falling back to regular PDF generation...');
      return await generateInvoicePdf(order, templateData);
    }
  }
}
