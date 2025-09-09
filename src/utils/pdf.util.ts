import ejs from 'ejs';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import Order from '../models/order.model';

interface PdfGenerationResult { filePath: string; }

function ensureDir(dir: string) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function renderHtmlToPdf(html: string, outPath: string) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    
    // Set the base URL to the templates directory so relative paths work
    const templatesDir = path.resolve(__dirname, '../../templates');
    await page.goto(`file://${templatesDir}/`);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({ 
      path: outPath, 
      format: 'A4', 
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
  } finally {
    await browser.close();
  }
}

async function generatePaginatedPdf(templatePath: string, templateData: any, outPath: string, itemsPerPage: number = 10) {
  console.log('🔧 Starting generatePaginatedPdf...');
  console.log('🔧 Template path:', templatePath);
  console.log('🔧 Output path:', outPath);
  console.log('🔧 Template data keys:', Object.keys(templateData));
  
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
  });
  
  try {
    const page = await browser.newPage();
    const templatesDir = path.resolve(__dirname, '../../templates');
    console.log('🔧 Templates directory:', templatesDir);
    
    await page.goto(`file://${templatesDir}/`);
    
    const items = templateData.items || templateData.returns || [];
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    console.log('🔧 Total items:', items.length, 'Total pages:', totalPages);
    
    const pdfPages: Buffer[] = [];
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, items.length);
      const pageItems = items.slice(startIndex, endIndex);
      
      const isLastPage = pageNum === totalPages - 1;
      
      const pageData = {
        ...templateData,
        items: pageItems,
        returns: pageItems, // For credit notes
        isLastPage: isLastPage,
        currentPage: pageNum + 1,
        totalPages: totalPages
      };
      
      console.log(`🔧 Page ${pageNum + 1}/${totalPages}, isLastPage: ${isLastPage}, items: ${pageItems.length}`);
      
      try {
        const html = await ejs.renderFile(templatePath, pageData) as string;
        console.log('🔧 HTML generated, length:', html.length);
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        console.log('🔧 Page content set');
        
        const pdfBuffer = await page.pdf({ 
          format: 'A4', 
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        });
        
        console.log('🔧 PDF buffer generated, size:', pdfBuffer.length);
        pdfPages.push(pdfBuffer);
      } catch (pageError) {
        console.error(`❌ Error generating page ${pageNum + 1}:`, pageError);
        throw pageError;
      }
    }
    
    console.log('🔧 Combining PDF pages...');
    // Combine all pages into a single PDF
    const { PDFDocument } = await import('pdf-lib');
    const finalPdf = await PDFDocument.create();
    
    for (const pdfBuffer of pdfPages) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pages = await finalPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => finalPdf.addPage(page));
    }
    
    const finalPdfBytes = await finalPdf.save();
    console.log('🔧 Final PDF bytes:', finalPdfBytes.length);
    
    fs.writeFileSync(outPath, finalPdfBytes);
    console.log('✅ PDF file written to:', outPath);
    
  } catch (error) {
    console.error('❌ Error in generatePaginatedPdf:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export async function generateInvoicePdf(order: Order, templateData: any): Promise<PdfGenerationResult> {
  const uploadsDir = path.resolve(__dirname, '../../uploads/invoices');
  ensureDir(uploadsDir);
  const fileName = `invoice_${order.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const templatePath = path.resolve(__dirname, '../../templates/invoice.ejs');
  await generatePaginatedPdf(templatePath, templateData, filePath, 10);
  return { filePath };
}

export async function generateCreditNotePdf(order: Order, templateData: any): Promise<PdfGenerationResult> {
  const uploadsDir = path.resolve(__dirname, '../../uploads/credit_notes');
  ensureDir(uploadsDir);
  const fileName = `credit_note_${order.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const templatePath = path.resolve(__dirname, '../../templates/creditNote.ejs');
  await generatePaginatedPdf(templatePath, templateData, filePath, 10);
  return { filePath };
}

export async function generateAngebotPdf(angebot: any, order: any, items: any[]): Promise<PdfGenerationResult> {
  try {
    console.log('🔧 Starting PDF generation for angebot:', angebot.id);
    
    const uploadsDir = path.resolve(__dirname, '../../uploads/angebots');
    ensureDir(uploadsDir);
    const fileName = `angebot_${angebot.id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    const templatePath = path.resolve(__dirname, '../../templates/angebot.ejs');
    console.log('🔧 Template path:', templatePath);
    console.log('🔧 Output path:', filePath);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    // Calculate totals
    let totalNet = 0;
    let tax7Amount = 0;
    let tax19Amount = 0;
    
    console.log('🔧 Processing items:', items.length);
    items.forEach((item, index) => {
      const itemTotal = (item.adjustedPrice || item.originalPrice) * item.quantity;
      totalNet += itemTotal;
      
      const taxRate = item.taxRate || 19;
      const taxAmount = itemTotal * taxRate / 100;
      
      if (taxRate === 7) {
        tax7Amount += taxAmount;
      } else if (taxRate === 19) {
        tax19Amount += taxAmount;
      }
      
      console.log(`🔧 Item ${index + 1}:`, {
        name: item.productName || item.orderProduct?.name,
        quantity: item.quantity,
        price: item.adjustedPrice || item.originalPrice,
        total: itemTotal,
        taxRate: taxRate
      });
    });
    
    const totalGross = totalNet + tax7Amount + tax19Amount;
    console.log('🔧 Calculated totals:', { totalNet, tax7Amount, tax19Amount, totalGross });
    
    const templateData = {
      angebot: {
        ...angebot,
        totalNet,
        tax7Amount,
        tax19Amount,
        totalGross
      },
      order,
      items
    };

    console.log('🔧 Calling generatePaginatedPdf...');
    await generatePaginatedPdf(templatePath, templateData, filePath, 10);
    
    // Verify file was created
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file was not created: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    console.log('✅ PDF file created successfully:', {
      path: filePath,
      size: stats.size,
      created: stats.birthtime
    });
    
    return { filePath };
  } catch (error) {
    console.error('❌ Error in generateAngebotPdf:', error);
    throw error;
  }
}
