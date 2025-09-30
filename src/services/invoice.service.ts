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

    // Load logo base64 data
    let logoBase64 = '';
    try {
      const logoPath = require('path').join(__dirname, '../../templates/logo-base64.txt');
      logoBase64 = require('fs').readFileSync(logoPath, 'utf8').trim();
    } catch (error: any) {
      console.warn('⚠️ Could not load logo base64 data:', error?.message || 'Unknown error');
    }

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
      logoBase64: logoBase64,
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
   * Generate multiple invoices as separate A4 pages
   * Each invoice gets its own complete page with summary and signature
   */
  private static async generateMultipleInvoicesPdf(
    invoices: Array<{ order: Order; templateData: any }>,
    outPath: string
  ) {
    try {
      console.log('🔧 Starting multiple invoices PDF generation...');
      console.log('🔧 Number of invoices:', invoices.length);

      const { launchPuppeteer } = require('./puppeteer.config');
      const browser = await launchPuppeteer();
      
      try {
        const page = await browser.newPage();
        const pdfPages: Buffer[] = [];
        
        // Generate each invoice as a separate A4 page
        for (let i = 0; i < invoices.length; i++) {
          const { order, templateData } = invoices[i];
          
          console.log(`🔧 Generating invoice ${i + 1}/${invoices.length} for order ${order.id}`);

          const pageData = {
            ...templateData,
            items: templateData.items,
            isLastPage: true, // Each invoice is complete on its own page
            currentPage: 1,
            totalPages: 1
          };

          // Generate HTML for this invoice
          const templatePath = require('path').resolve(__dirname, '../../templates/invoice.ejs');
          const pageHtml = await require('ejs').renderFile(templatePath, pageData);
          
          // Set content and generate PDF for this invoice
          await page.setContent(pageHtml, { waitUntil: 'networkidle0' });
          
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
            preferCSSPageSize: true,
            displayHeaderFooter: false
          });
          
          pdfPages.push(pdfBuffer);
          console.log(`✅ Invoice ${i + 1} generated, size: ${pdfBuffer.length} bytes`);
        }
        
        // Merge all invoice pages into a single PDF
        console.log('🔧 Merging invoice pages...');
        const { PDFDocument } = await import('pdf-lib');
        const finalPdf = await PDFDocument.create();
        
        for (const pdfBuffer of pdfPages) {
          const pdf = await PDFDocument.load(pdfBuffer);
          const pages = await finalPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((page) => finalPdf.addPage(page));
        }
        
        const finalPdfBytes = await finalPdf.save();
        require('fs').writeFileSync(outPath, finalPdfBytes);
        
        console.log('✅ Multiple invoices PDF generated successfully:', outPath);
        
      } finally {
        await browser.close();
      }
      
    } catch (error: any) {
      console.error('❌ Error generating multiple invoices PDF:', error);
      throw new Error(`Multiple invoices PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate paginated invoice PDF with proper A4 page breaks and no blue labels
   * Each page is a complete invoice with summary and signature
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
      
      const templatePath = path.resolve(__dirname, '../../templates/invoice.ejs');
      
      // Generate individual PDF pages and merge them
      console.log('🔧 Generating individual PDF pages and merging...');
      
      try {
        const { launchPuppeteer } = require('./puppeteer.config');
        const browser = await launchPuppeteer();
        
        try {
          const page = await browser.newPage();
          const pdfPages: Buffer[] = [];
          
          // Generate each page separately - each page is a complete invoice
          for (let pageNum = 0; pageNum < totalPages; pageNum++) {
            const startIndex = pageNum * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, templateData.items.length);
            const pageItems = templateData.items.slice(startIndex, endIndex);
            const isLastPage = pageNum === totalPages - 1;
            
            console.log(`🔧 Generating page ${pageNum + 1}/${totalPages} (items ${startIndex + 1}-${endIndex})`);

            // Calculate totals for this page only
            const pageTotalNet = pageItems.reduce((sum, item) => sum + item.total, 0);
            const pageVat7 = pageItems.reduce((sum, item) => sum + (item.tax7 || 0), 0);
            const pageVat19 = pageItems.reduce((sum, item) => sum + (item.tax19 || 0), 0);
            const pageTotalGross = pageTotalNet + pageVat7 + pageVat19;

            const pageData = {
              ...templateData,
              items: pageItems,
              isLastPage,
              currentPage: pageNum + 1,
              totalPages,
              // Override totals for this page
              totalNet: pageTotalNet,
              vat7: pageVat7,
              vat19: pageVat19,
              totalGross: pageTotalGross
            };

            // Generate HTML for this page only
            const pageHtml = await require('ejs').renderFile(templatePath, pageData);
            
            // Set content and generate PDF for this page
            await page.setContent(pageHtml, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true,
              margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
              preferCSSPageSize: true,
              displayHeaderFooter: false
            });
            
            pdfPages.push(pdfBuffer);
            console.log(`✅ Page ${pageNum + 1} generated, size: ${pdfBuffer.length} bytes`);
          }
          
          // Merge all pages into a single PDF
          console.log('🔧 Merging PDF pages...');
          const { PDFDocument } = await import('pdf-lib');
          const finalPdf = await PDFDocument.create();
          
          for (const pdfBuffer of pdfPages) {
            const pdf = await PDFDocument.load(pdfBuffer);
            const pages = await finalPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => finalPdf.addPage(page));
          }
          
          const finalPdfBytes = await finalPdf.save();
          fs.writeFileSync(filePath, finalPdfBytes);
          
          console.log('✅ Multi-page PDF generated successfully:', filePath);
          
        } finally {
          await browser.close();
        }
        
      } catch (puppeteerError: any) {
        console.error('❌ Puppeteer PDF generation failed:', puppeteerError.message);
        console.log('🔄 Falling back to HTML generation...');
        
        // Fallback: Generate HTML file instead of PDF
        const htmlFileName = `invoice_${order.id}_${Date.now()}.html`;
        const htmlFilePath = path.join(uploadsDir, htmlFileName);
        
        // Generate HTML for all pages with proper page breaks
        let fullHtml = '';
        let isFirstPage = true;
        
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const startIndex = pageNum * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, templateData.items.length);
          const pageItems = templateData.items.slice(startIndex, endIndex);
          const isLastPage = pageNum === totalPages - 1;
          
          // Calculate totals for this page only
          const pageTotalNet = pageItems.reduce((sum, item) => sum + item.total, 0);
          const pageVat7 = pageItems.reduce((sum, item) => sum + (item.tax7 || 0), 0);
          const pageVat19 = pageItems.reduce((sum, item) => sum + (item.tax19 || 0), 0);
          const pageTotalGross = pageTotalNet + pageVat7 + pageVat19;
          
          const pageData = {
            ...templateData,
            items: pageItems,
            isLastPage,
            currentPage: pageNum + 1,
            totalPages,
            // Override totals for this page
            totalNet: pageTotalNet,
            vat7: pageVat7,
            vat19: pageVat19,
            totalGross: pageTotalGross
          };
          
          const pageHtml = await require('ejs').renderFile(templatePath, pageData);
          
          if (isFirstPage) {
            // For the first page, use the complete HTML structure
            fullHtml = pageHtml;
            isFirstPage = false;
          } else {
            // For subsequent pages, extract only the content between <body> and </body>
            const bodyMatch = pageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) {
              const bodyContent = bodyMatch[1];
              // Remove the closing tags from the previous page and add the new page content
              fullHtml = fullHtml.replace(/<\/body>[\s\S]*$/, '') + bodyContent + '</body></html>';
            }
          }
        }
        
        // Add PDF conversion script to HTML (without blue labels in PDF output)
        const enhancedHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${templateData.invoiceNumber}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .pdf-controls { 
            position: fixed; top: 10px; right: 10px; 
            background: #007bff; color: white; padding: 10px; 
            border-radius: 5px; z-index: 1000; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .pdf-controls button { 
            background: white; color: #007bff; border: none; 
            padding: 8px 16px; margin: 0 5px; border-radius: 3px; 
            cursor: pointer; font-weight: bold; 
        }
        .pdf-controls button:hover {
            background: #f8f9fa;
        }
        @media print { 
            .pdf-controls { display: none !important; } 
            body { padding: 0; background: white; }
        }
        /* Ensure proper page breaks for PDF */
        .a4-page {
            page-break-after: always;
            page-break-inside: avoid;
        }
        .a4-page:last-child {
            page-break-after: avoid;
        }
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
                // Hide controls before conversion
                const controls = document.querySelector('.pdf-controls');
                if (controls) controls.style.display = 'none';
                
                // Get all A4 pages
                const pages = document.querySelectorAll('.a4-page');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    const canvas = await html2canvas(page, { 
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: 794, // A4 width in pixels at 96 DPI
                        height: 1123 // A4 height in pixels at 96 DPI
                    });
                    
                    if (i > 0) {
                        pdf.addPage();
                    }
                    
                    const imgWidth = 210; // A4 width in mm
                    const imgHeight = 297; // A4 height in mm
                    
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
                }
                
                const filename = 'invoice_${templateData.invoiceNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf';
                pdf.save(filename);
                
                // Show controls again
                if (controls) controls.style.display = 'block';
                
                console.log('✅ PDF generated successfully with', pages.length, 'pages');
            } catch (error) {
                console.error('❌ PDF conversion failed:', error);
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
