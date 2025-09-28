import Invoice from '../models/invoice.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import Store from '../models/store.model';
import { generateInvoicePdf, generatePaginatedPdf } from '../utils/pdf.util';
import PDFMerger from 'pdf-merger-js';
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
      const ITEMS_PER_PAGE = 18;
      
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
    // we can fit approximately 18 items per page on A4
    const ITEMS_PER_PAGE = 18;
    
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
    console.log('🔧 Invoice service - calling generatePaginatedInvoicePdf with:', {
      itemsCount: templateData.items.length,
      itemsPerPage: ITEMS_PER_PAGE,
      totalNet: templateData.totalNet,
      totalGross: templateData.totalGross
    });
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
  private static async generatePaginatedInvoicePdf(
    order: Order,
    templateData: any,
    itemsPerPage: number = 18
  ) {
    try {
      console.log('🔧 Starting paginated invoice PDF generation...');

      const uploadsDir = require('path').resolve(__dirname, '../../uploads/invoices');
      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fileName = `invoice_${order.id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Validate input data
      if (!templateData.items || !Array.isArray(templateData.items)) {
        throw new Error('Invalid template data: items array is missing or invalid');
      }
      
      if (templateData.items.length === 0) {
        throw new Error('Cannot generate invoice: no items found');
      }

      const totalPages = Math.max(1, Math.ceil(templateData.items.length / itemsPerPage));
      console.log('🔧 Total pages:', totalPages);
      console.log('🔧 Items count:', templateData.items.length);
      console.log('🔧 Items per page:', itemsPerPage);

      // Force multi-page generation - don't fall back to single page
      console.log('🔧 FORCING multi-page generation - no fallback to single page');
      
      const templatePath = path.resolve(__dirname, '../../templates/invoice.ejs');
      
      if (totalPages === 1) {
        console.log('🔧 Single page invoice - generating with bank details');
        const singlePageData = {
          ...templateData,
          isLastPage: true,
          currentPage: 1,
          totalPages: 1
        };
        
        try {
          return await generateInvoicePdf(order, singlePageData);
        } catch (pdfError: any) {
          console.error('❌ Single page PDF generation failed:', pdfError.message);
          console.log('🔄 Falling back to HTML generation for single page...');
          
          // Fallback: Generate HTML file instead of PDF
          const htmlFileName = `invoice_${order.id}_${Date.now()}.html`;
          const htmlFilePath = path.join(uploadsDir, htmlFileName);
          
          const html = await require('ejs').renderFile(templatePath, singlePageData);
          
          // Add PDF conversion script to HTML
          const enhancedHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${singlePageData.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .pdf-controls { 
            position: fixed; top: 10px; right: 10px; 
            background: #007bff; color: white; padding: 10px; 
            border-radius: 5px; z-index: 1000; 
        }
        .pdf-controls button { 
            background: white; color: #007bff; border: none; 
            padding: 8px 16px; margin: 0 5px; border-radius: 3px; 
            cursor: pointer; font-weight: bold; 
        }
        @media print { .pdf-controls { display: none; } }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
    <div class="pdf-controls">
        <span>📄 Invoice Ready</span>
        <button onclick="convertToPdf()">📥 Download PDF</button>
        <button onclick="window.print()">🖨️ Print</button>
    </div>
    ${html}
    <script>
        async function convertToPdf() {
            try {
                const element = document.body;
                const canvas = await html2canvas(element, { scale: 2 });
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                const filename = 'invoice_${singlePageData.invoiceNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf';
                pdf.save(filename);
            } catch (error) {
                alert('PDF conversion failed. Please use the print function instead.');
            }
        }
    </script>
</body>
</html>`;
          
          fs.writeFileSync(htmlFilePath, enhancedHtml);
          console.log('✅ Single page HTML invoice generated with PDF conversion:', htmlFilePath);
          
          return { filePath: htmlFilePath };
        }
      }
      
      // Multi-page generation with Puppeteer fallback
      console.log('🔧 Multi-page invoice - generating pages separately');
      
      try {
        // Try PDF generation first
        const tempFiles: string[] = [];
        const browser = await require('puppeteer').launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
          const page = await browser.newPage();
          
          for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            const startIndex = pageNum * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, templateData.items.length);
            const pageItems = templateData.items.slice(startIndex, endIndex);
            const isLastPage = pageNum === totalPages - 1;
            
            console.log(`🔧 Generating page ${pageNum + 1}/${totalPages} (items ${startIndex + 1}-${endIndex})`);
            
            const pageData = {
              ...templateData,
              items: pageItems,
              isLastPage,
              currentPage: pageNum + 1,
              totalPages
            };
            
            // Generate HTML and PDF for this page
            const html = await require('ejs').renderFile(templatePath, pageData);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const tempFileName = `temp_page_${pageNum + 1}_${order.id}_${Date.now()}.pdf`;
            const tempFilePath = path.join(uploadsDir, tempFileName);
            tempFiles.push(tempFilePath);
            
            await page.pdf({
              path: tempFilePath,
              format: 'A4',
              printBackground: true,
              margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' }
            });
            
            console.log(`✅ Page ${pageNum + 1} generated: ${tempFilePath}`);
          }
          
          // Merge PDFs
          console.log('🔧 Merging PDF pages...');
          const merger = new PDFMerger();
          for (const tempFile of tempFiles) {
            await merger.add(tempFile);
          }
          await merger.save(filePath);
          
          console.log('✅ Multi-page PDF merged successfully:', filePath);
          
        } finally {
          await browser.close();
          
          // Clean up temp files
          tempFiles.forEach(tempFile => {
            try {
              if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
          });
        }
        
      } catch (puppeteerError: any) {
        console.error('❌ Puppeteer PDF generation failed:', puppeteerError.message);
        console.log('🔄 Falling back to HTML generation...');
        
        // Fallback: Generate HTML file instead of PDF
        const htmlFileName = `invoice_${order.id}_${Date.now()}.html`;
        const htmlFilePath = path.join(uploadsDir, htmlFileName);
        
        // Generate HTML for all pages
        let fullHtml = '';
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const startIndex = pageNum * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, templateData.items.length);
          const pageItems = templateData.items.slice(startIndex, endIndex);
          const isLastPage = pageNum === totalPages - 1;
          
          const pageData = {
            ...templateData,
            items: pageItems,
            isLastPage,
            currentPage: pageNum + 1,
            totalPages
          };
          
          const pageHtml = await require('ejs').renderFile(templatePath, pageData);
          fullHtml += pageHtml;
          
          // Add page break for multi-page
          if (pageNum < totalPages - 1) {
            fullHtml += '<div style="page-break-before: always;"></div>';
          }
        }
        
        // Add PDF conversion script to HTML
        const enhancedHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${templateData.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .pdf-controls { 
            position: fixed; top: 10px; right: 10px; 
            background: #007bff; color: white; padding: 10px; 
            border-radius: 5px; z-index: 1000; 
        }
        .pdf-controls button { 
            background: white; color: #007bff; border: none; 
            padding: 8px 16px; margin: 0 5px; border-radius: 3px; 
            cursor: pointer; font-weight: bold; 
        }
        @media print { .pdf-controls { display: none; } }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
    <div class="pdf-controls">
        <span>📄 Invoice Ready</span>
        <button onclick="convertToPdf()">📥 Download PDF</button>
        <button onclick="window.print()">🖨️ Print</button>
    </div>
    ${fullHtml}
    <script>
        async function convertToPdf() {
            try {
                const element = document.body;
                const canvas = await html2canvas(element, { scale: 2 });
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                const filename = 'invoice_${templateData.invoiceNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf';
                pdf.save(filename);
            } catch (error) {
                alert('PDF conversion failed. Please use the print function instead.');
            }
        }
    </script>
</body>
</html>`;
        
        fs.writeFileSync(htmlFilePath, enhancedHtml);
        console.log('✅ HTML invoice generated with PDF conversion:', htmlFilePath);
        
        // Return HTML file path instead of PDF
        return { filePath: htmlFilePath };
      }
      
      return { filePath };

    } catch (error: any) {
      console.error('❌ Error generating paginated invoice PDF:', error);
      console.error('❌ Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      });
      
      // NO FALLBACK - throw the error so we can see what's wrong
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}
