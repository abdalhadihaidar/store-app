import ejs from 'ejs';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import Order from '../models/order.model';
import { launchPuppeteer } from './puppeteer.config';

interface PdfGenerationResult { filePath: string; }

function ensureDir(dir: string) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function renderHtmlToPdf(html: string, outPath: string) {
  const browser = await launchPuppeteer();
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

async function generatePdfAlternative(templatePath: string, templateData: any, outPath: string) {
  console.log('🔧 Using alternative PDF generation method...');
  console.log('🔧 Template path:', templatePath);
  console.log('🔧 Output path:', outPath);
  
  try {
    // Generate HTML from template
    console.log('🔧 Rendering HTML from template...');
    const html = await ejs.renderFile(templatePath, templateData) as string;
    console.log('✅ HTML rendered successfully, length:', html.length);
    
    // Try to use a simpler Puppeteer configuration
    console.log('🔧 Launching Puppeteer with alternative config...');
    const puppeteer = require('puppeteer');
    
    // Check if Puppeteer is available
    console.log('🔧 Puppeteer version:', puppeteer.version || 'unknown');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    try {
      const page = await browser.newPage();
      console.log('✅ New page created');
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      console.log('✅ Content set on page');
      
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
      
      console.log('✅ PDF buffer generated, size:', pdfBuffer.length);
      
      fs.writeFileSync(outPath, pdfBuffer);
      console.log('✅ Alternative PDF generation successful:', outPath);
      
      // Check if file is actually a PDF by reading first few bytes
      const buffer = fs.readFileSync(outPath, { encoding: null });
      const fileSignature = buffer.slice(0, 4);
      const isPdf = fileSignature.toString('hex') === '25504446'; // %PDF
      console.log('🔍 Alternative PDF file signature check:', {
        signature: fileSignature.toString('hex'),
        isPdf: isPdf,
        firstBytes: buffer.slice(0, 20).toString()
      });
      
      if (!isPdf) {
        console.warn('⚠️ Alternative generated file does not appear to be a valid PDF!');
      }
      
      // Verify file was created
      if (fs.existsSync(outPath)) {
        const stats = fs.statSync(outPath);
        console.log('✅ PDF file verified:', { size: stats.size, path: outPath });
      } else {
        throw new Error('PDF file was not created');
      }
    } finally {
      await browser.close();
      console.log('✅ Browser closed');
    }
  } catch (error: any) {
    console.error('❌ Alternative PDF generation failed:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    throw error;
  }
}

async function generatePdfDirect(templatePath: string, templateData: any, outPath: string) {
  console.log('🔧 Using direct HTML to PDF conversion...');
  console.log('🔧 Template path:', templatePath);
  console.log('🔧 Output path:', outPath);
  
  try {
    // Generate HTML from template
    console.log('🔧 Rendering HTML from template...');
    const html = await ejs.renderFile(templatePath, templateData) as string;
    console.log('✅ HTML rendered successfully, length:', html.length);
    
    // Try using html-pdf-node if available
    try {
      console.log('🔧 Trying html-pdf-node...');
      const pdf = require('html-pdf-node');
      
      const options = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      };
      
      const result = await pdf.generatePdf({ content: html }, options);
      fs.writeFileSync(outPath, result);
      console.log('✅ Direct PDF generation successful with html-pdf-node:', outPath);
      return;
    } catch (htmlPdfError: any) {
      console.log('❌ html-pdf-node failed:', htmlPdfError.message);
    }
    
    // Try using wkhtmltopdf if available
    try {
      console.log('🔧 Trying wkhtmltopdf...');
      const wkhtmltopdf = require('wkhtmltopdf');
      
      const stream = wkhtmltopdf(html, {
        pageSize: 'A4',
        marginTop: '20mm',
        marginRight: '15mm',
        marginBottom: '20mm',
        marginLeft: '15mm'
      });
      
      const writeStream = fs.createWriteStream(outPath);
      stream.pipe(writeStream);
      
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (error) => reject(error));
      });
      
      console.log('✅ Direct PDF generation successful with wkhtmltopdf:', outPath);
      return;
    } catch (wkhtmltopdfError: any) {
      console.log('❌ wkhtmltopdf failed:', wkhtmltopdfError.message);
    }
    
    // If all direct methods fail, throw error
    throw new Error('All direct PDF generation methods failed');
    
  } catch (error: any) {
    console.error('❌ Direct PDF generation failed:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    throw error;
  }
}

export async function generatePaginatedPdf(templatePath: string, templateData: any, outPath: string, itemsPerPage: number = 10) {
  console.log('🔧 Starting generatePaginatedPdf...');
  console.log('🔧 Template path:', templatePath);
  console.log('🔧 Output path:', outPath);
  console.log('🔧 Template data keys:', Object.keys(templateData));
  
  const browser = await launchPuppeteer();
  
  try {
    const page = await browser.newPage();
    const templatesDir = path.resolve(__dirname, '../../templates');
    console.log('🔧 Templates directory:', templatesDir);
    
    await page.goto(`file://${templatesDir}/`);
    
    const items = templateData.items || templateData.returns || [];
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    
    console.log(`🔧 Processing ${items.length} items across ${totalPages} pages (${itemsPerPage} items per page)`);
    
    // 👉 Fast-path: if everything fits on one page, render once and skip costly PDF merge logic
    if (totalPages === 1) {
      try {
        const singleHtml = await ejs.renderFile(templatePath, {
          ...templateData,
          items,
          returns: items, // for credit notes
          isLastPage: true,
          currentPage: 1,
          totalPages: 1,
        }) as string;

        await page.setContent(singleHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm',
          },
        });

        fs.writeFileSync(outPath, pdfBuffer);
        console.log('✅ Single-page PDF written:', outPath, 'size:', pdfBuffer.length);
        return; // finished
      } finally {
        await browser.close();
      }
    }
    
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
          },
          // Add page break handling
          preferCSSPageSize: true,
          displayHeaderFooter: false
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
    
  } catch (error: any) {
    console.error('❌ Error in generatePaginatedPdf:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    throw error;
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      console.error('❌ Error closing browser:', closeError);
    }
  }
}

export async function generateInvoicePdf(order: Order, templateData: any): Promise<PdfGenerationResult> {
  try {
    const uploadsDir = path.resolve(__dirname, '../../uploads/invoices');
    ensureDir(uploadsDir);
    const fileName = `invoice_${order.id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    const templatePath = path.resolve(__dirname, '../../templates/invoice.ejs');
    
    // Try multiple approaches to generate PDF
    try {
      console.log('🔧 Attempt 1: Direct PDF generation (html-pdf-node/wkhtmltopdf)...');
      await generatePdfDirect(templatePath, templateData, filePath);
      return { filePath };
    } catch (directError: any) {
      console.error('❌ Direct PDF generation failed:', directError);
      
      // Try alternative PDF generation method
      try {
        console.log('🔧 Attempt 2: Alternative PDF generation...');
        await generatePdfAlternative(templatePath, templateData, filePath);
        return { filePath };
      } catch (altError: any) {
        console.error('❌ Alternative PDF generation failed:', altError);
        
        // Try third method: Direct HTML to PDF conversion
        try {
          console.log('🔧 Attempt 3: Direct HTML to PDF conversion...');
          await generatePdfDirect(templatePath, templateData, filePath);
          return { filePath };
        } catch (directError: any) {
          console.error('❌ Direct PDF generation failed:', directError);
          
          // Only as last resort, create HTML fallback
          console.log('🔄 All PDF methods failed, creating HTML fallback as last resort...');
          return await createInvoiceHtmlFallback(order, templateData);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error in generateInvoicePdf:', error);
    throw error;
  }
}

export async function generateCreditNotePdf(order: Order, templateData: any): Promise<PdfGenerationResult> {
  try {
    const uploadsDir = path.resolve(__dirname, '../../uploads/credit_notes');
    ensureDir(uploadsDir);
    const fileName = `credit_note_${order.id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    const templatePath = path.resolve(__dirname, '../../templates/creditNote.ejs');
    
    // Try multiple approaches to generate PDF
    try {
      console.log('🔧 Attempt 1: Direct PDF generation (html-pdf-node/wkhtmltopdf)...');
      await generatePdfDirect(templatePath, templateData, filePath);
      return { filePath };
    } catch (directError: any) {
      console.error('❌ Direct PDF generation failed:', directError);
      
      // Try alternative PDF generation method
      try {
        console.log('🔧 Attempt 2: Alternative PDF generation...');
        await generatePdfAlternative(templatePath, templateData, filePath);
        return { filePath };
      } catch (altError: any) {
        console.error('❌ Alternative PDF generation failed:', altError);
        
        // Try third method: Paginated PDF generation
        try {
          console.log('🔧 Attempt 3: Paginated PDF generation...');
          await generatePaginatedPdf(templatePath, templateData, filePath, 10);
          return { filePath };
        } catch (paginatedError: any) {
          console.error('❌ Paginated PDF generation failed:', paginatedError);
          
          // Only as last resort, create HTML fallback
          console.log('🔄 All PDF methods failed, creating HTML fallback as last resort...');
          return await createCreditNoteHtmlFallback(order, templateData);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error in generateCreditNotePdf:', error);
    throw error;
  }
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
      // Packet-based calculation
      const itemTotal = (item.adjustedPrice || item.originalPrice) * item.packages;
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
        packages: item.packages,
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
      items,
      currentPage: 1, // Default to page 1
      isLastPage: true // Always show validity information for angebots
    };

    // Try multiple approaches to generate PDF
    try {
      console.log('🔧 Attempt 1: Direct PDF generation (html-pdf-node/wkhtmltopdf)...');
      await generatePdfDirect(templatePath, templateData, filePath);
      
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
      
      // Check if file is actually a PDF by reading first few bytes
      const buffer = fs.readFileSync(filePath, { encoding: null });
      const fileSignature = buffer.slice(0, 4);
      const isPdf = fileSignature.toString('hex') === '25504446'; // %PDF
      console.log('🔍 File signature check:', {
        signature: fileSignature.toString('hex'),
        isPdf: isPdf,
        firstBytes: buffer.slice(0, 20).toString()
      });
      
      if (!isPdf) {
        console.warn('⚠️ Generated file does not appear to be a valid PDF!');
      }
      
      return { filePath };
    } catch (directError: any) {
      console.error('❌ Direct PDF generation failed:', directError);
      
      // Try alternative PDF generation method
      try {
        console.log('🔧 Attempt 2: Alternative PDF generation...');
        await generatePdfAlternative(templatePath, templateData, filePath);
        
        // Verify file was created
        if (!fs.existsSync(filePath)) {
          throw new Error(`PDF file was not created: ${filePath}`);
        }
        
        const stats = fs.statSync(filePath);
        console.log('✅ Alternative PDF file created successfully:', {
          path: filePath,
          size: stats.size,
          created: stats.birthtime
        });
        
        return { filePath };
      } catch (altError: any) {
        console.error('❌ Alternative PDF generation failed:', altError);
        
        // Try third method: Direct HTML to PDF conversion
        try {
          console.log('🔧 Attempt 3: Direct HTML to PDF conversion...');
          await generatePdfDirect(templatePath, templateData, filePath);
          
          // Verify file was created
          if (!fs.existsSync(filePath)) {
            throw new Error(`PDF file was not created: ${filePath}`);
          }
          
          const stats = fs.statSync(filePath);
          console.log('✅ Direct PDF file created successfully:', {
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          });
          
          return { filePath };
        } catch (directError: any) {
          console.error('❌ Direct PDF generation failed:', directError);
          
          // Only as last resort, create HTML fallback
          console.log('🔄 All PDF methods failed, creating HTML fallback as last resort...');
          return await createHtmlFallback(angebot, order, items);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error in generateAngebotPdf:', error);
    throw error;
  }
}

async function createInvoiceHtmlFallback(order: Order, templateData: any): Promise<PdfGenerationResult> {
  try {
    console.log('🔄 Creating pixel-perfect HTML fallback for invoice, order:', order.id);
    
    const uploadsDir = path.resolve(__dirname, '../../uploads/invoices');
    ensureDir(uploadsDir);
    const fileName = `invoice_${order.id}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log('🔧 HTML fallback file path:', filePath);

    const templatePath = path.resolve(__dirname, '../../templates/invoice.ejs');

    // Generate HTML instead of PDF with enhanced styling for PDF conversion
    const html = await ejs.renderFile(templatePath, templateData) as string;
    
    // Enhance HTML with PDF-ready styling and frontend PDF conversion script
    const enhancedHtml = enhanceHtmlForPdfConversion(html, 'invoice', order.id.toString());
    
    fs.writeFileSync(filePath, enhancedHtml);
    
    // Verify HTML file was created properly
    const stats = fs.statSync(filePath);
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const isHtml = htmlContent.trim().startsWith('<!DOCTYPE html>') || htmlContent.trim().startsWith('<html');
    
    console.log('✅ Pixel-perfect invoice HTML fallback created:', {
      path: filePath,
      size: stats.size,
      isHtml: isHtml,
      startsWith: htmlContent.trim().substring(0, 50)
    });
    return { filePath };
  } catch (error: any) {
    console.error('❌ Error creating invoice HTML fallback:', error);
    throw error;
  }
}

async function createCreditNoteHtmlFallback(order: Order, templateData: any): Promise<PdfGenerationResult> {
  try {
    console.log('🔄 Creating pixel-perfect HTML fallback for credit note, order:', order.id);
    
    const uploadsDir = path.resolve(__dirname, '../../uploads/credit_notes');
    ensureDir(uploadsDir);
    const fileName = `credit_note_${order.id}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log('🔧 HTML fallback file path:', filePath);

    const templatePath = path.resolve(__dirname, '../../templates/creditNote.ejs');

    // Generate HTML instead of PDF with enhanced styling for PDF conversion
    const html = await ejs.renderFile(templatePath, templateData) as string;
    
    // Enhance HTML with PDF-ready styling and frontend PDF conversion script
    const enhancedHtml = enhanceHtmlForPdfConversion(html, 'credit_note', order.id.toString());
    
    fs.writeFileSync(filePath, enhancedHtml);
    
    // Verify HTML file was created properly
    const stats = fs.statSync(filePath);
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const isHtml = htmlContent.trim().startsWith('<!DOCTYPE html>') || htmlContent.trim().startsWith('<html');
    
    console.log('✅ Pixel-perfect credit note HTML fallback created:', {
      path: filePath,
      size: stats.size,
      isHtml: isHtml,
      startsWith: htmlContent.trim().substring(0, 50)
    });
    return { filePath };
  } catch (error: any) {
    console.error('❌ Error creating credit note HTML fallback:', error);
    throw error;
  }
}

async function createHtmlFallback(angebot: any, order: any, items: any[]): Promise<PdfGenerationResult> {
  try {
    console.log('🔄 Creating HTML fallback for angebot:', angebot.id);
    
    const uploadsDir = path.resolve(__dirname, '../../uploads/angebots');
    ensureDir(uploadsDir);
    const fileName = `angebot_${angebot.id}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log('🔧 HTML fallback file path:', filePath);

    const templatePath = path.resolve(__dirname, '../../templates/angebot.ejs');
    
    // Calculate totals
    let totalNet = 0;
    let tax7Amount = 0;
    let tax19Amount = 0;
    
    items.forEach((item) => {
      const itemTotal = (item.adjustedPrice || item.originalPrice) * item.quantity;
      totalNet += itemTotal;
      
      const taxRate = item.taxRate || 19;
      const taxAmount = itemTotal * taxRate / 100;
      
      if (taxRate === 7) {
        tax7Amount += taxAmount;
      } else if (taxRate === 19) {
        tax19Amount += taxAmount;
      }
    });
    
    const totalGross = totalNet + tax7Amount + tax19Amount;
    
    const templateData = {
      angebot: {
        ...angebot,
        totalNet,
        tax7Amount,
        tax19Amount,
        totalGross
      },
      order,
      items,
      currentPage: 1, // Default to page 1
      isLastPage: true // Always show validity information for angebots
    };

    // Generate HTML instead of PDF with enhanced styling for PDF conversion
    const html = await ejs.renderFile(templatePath, templateData) as string;
    
    // Enhance HTML with PDF-ready styling and frontend PDF conversion script
    const enhancedHtml = enhanceHtmlForPdfConversion(html, 'angebot', angebot.id.toString());
    
    fs.writeFileSync(filePath, enhancedHtml);
    
    // Verify HTML file was created properly
    const stats = fs.statSync(filePath);
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const isHtml = htmlContent.trim().startsWith('<!DOCTYPE html>') || htmlContent.trim().startsWith('<html');
    
    console.log('✅ Pixel-perfect angebot HTML fallback created:', {
      path: filePath,
      size: stats.size,
      isHtml: isHtml,
      startsWith: htmlContent.trim().substring(0, 50)
    });
    return { filePath };
  } catch (error: any) {
    console.error('❌ Error creating HTML fallback:', error);
    throw error;
  }
}

function enhanceHtmlForPdfConversion(html: string, documentType: string, documentId: string): string {
  console.log('🔧 Enhancing HTML for PDF conversion:', documentType, documentId);
  
  // Extract the head content (including styles) from the original HTML
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';
  
  // Extract the body content from the HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;
  
  // Fix logo and asset paths to be accessible
  bodyContent = fixAssetPaths(bodyContent);
  
  // Create enhanced HTML with original styling preserved and frontend conversion script
  const enhancedHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentType.charAt(0).toUpperCase() + documentType.slice(1)} ${documentId}</title>
    
    <!-- Original Template Styles (Preserved) -->
    ${headContent}
    
    <!-- Additional PDF-Ready CSS -->
    <style>
        /* Ensure consistent rendering for PDF conversion */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        /* PDF conversion specific styles */
        .pdf-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        /* Ensure proper page breaks for PDF */
        .a4-page {
            page-break-after: always;
            page-break-inside: avoid;
        }
        .a4-page:last-child {
            page-break-after: avoid;
        }
        
        /* Hide PDF conversion controls in final PDF */
        .pdf-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #007bff;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        /* Ensure controls are hidden in print/PDF */
        @media print {
            .pdf-controls {
                display: none !important;
            }
        }
        
        .pdf-controls button {
            background: white;
            color: #007bff;
            border: none;
            padding: 8px 16px;
            margin: 0 5px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .pdf-controls button:hover {
            background: #f8f9fa;
        }
        
        /* Ensure tables and content are PDF-ready */
        table {
            border-collapse: collapse;
            width: 100%;
            page-break-inside: avoid;
        }
        
        tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        
        /* Ensure images are properly sized and visible */
        img {
            max-width: 100%;
            height: auto;
        }
        
        /* Ensure logo and images are visible */
        .logo, .company-logo {
            max-width: 200px;
            height: auto;
        }
    </style>
    
    <!-- PDF Generation Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
    <!-- PDF Conversion Controls -->
    <div class="pdf-controls">
        <span>📄 ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Ready</span>
        <button onclick="convertToPdf()">📥 Download PDF</button>
        <button onclick="printDocument()">🖨️ Print</button>
    </div>
    
    <!-- Document Content (Preserving Original Structure) -->
    <div class="pdf-container">
        ${bodyContent}
    </div>
    
    <!-- PDF Conversion Script -->
    <script>
        async function convertToPdf() {
            try {
                console.log('🔧 Starting PDF conversion...');
                
                // Hide controls before conversion
                const controls = document.querySelector('.pdf-controls');
                if (controls) controls.style.display = 'none';
                
                // Show loading state
                const button = event.target;
                const originalText = button.innerHTML;
                button.innerHTML = '⏳ Converting...';
                button.disabled = true;
                
                // Get the document container
                const element = document.querySelector('.pdf-container');
                
                // Convert to canvas with high quality
                const canvas = await html2canvas(element, {
                    scale: 2, // Higher resolution
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight
                });
                
                console.log('✅ Canvas created, dimensions:', canvas.width, 'x', canvas.height);
                
                // Create PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                // Calculate dimensions
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 295; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                
                let position = 0;
                
                // Add first page
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                // Add additional pages if needed
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                // Generate filename
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                const filename = '${documentType}_${documentId}_' + timestamp + '.pdf';
                
                // Download PDF
                pdf.save(filename);
                
                console.log('✅ PDF generated and downloaded:', filename);
                
                // Reset button
                button.innerHTML = originalText;
                button.disabled = false;
                
                // Show controls again
                if (controls) controls.style.display = 'block';
                
                // Show success message
                showMessage('✅ PDF downloaded successfully!', 'success');
                
            } catch (error) {
                console.error('❌ PDF conversion failed:', error);
                
                // Reset button
                const button = event.target;
                button.innerHTML = '📥 Download PDF';
                button.disabled = false;
                
                // Show controls again
                const controls = document.querySelector('.pdf-controls');
                if (controls) controls.style.display = 'block';
                
                // Show error message
                showMessage('❌ PDF conversion failed. Please try again.', 'error');
            }
        }
        
        function printDocument() {
            console.log('🖨️ Printing document...');
            window.print();
        }
        
        function showMessage(message, type) {
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: \${type === 'success' ? '#28a745' : '#dc3545'};
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            \`;
            messageEl.textContent = message;
            
            document.body.appendChild(messageEl);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
        
        // Auto-hide controls when printing
        window.addEventListener('beforeprint', function() {
            document.querySelector('.pdf-controls').style.display = 'none';
        });
        
        window.addEventListener('afterprint', function() {
            document.querySelector('.pdf-controls').style.display = 'block';
        });
        
        // Initialize
        console.log('📄 PDF-ready document loaded for ${documentType} ${documentId}');
        console.log('🔧 Available functions: convertToPdf(), printDocument()');
    </script>
</body>
</html>`;

  return enhancedHtml;
}

function fixAssetPaths(bodyContent: string): string {
  console.log('🔧 Fixing asset paths in HTML content...');
  
  try {
    // Check if logo file exists and convert to base64
    const logoPath = path.resolve(__dirname, '../../templates/Capture.png');
    if (fs.existsSync(logoPath)) {
      console.log('✅ Logo file found, converting to base64...');
      
      // Read logo file and convert to base64
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoMimeType = 'image/png'; // Assuming PNG based on filename
      const logoDataUrl = `data:${logoMimeType};base64,${logoBase64}`;
      
      // Replace logo references with base64 data URL
      bodyContent = bodyContent.replace(
        /src="Capture\.png"/g,
        `src="${logoDataUrl}"`
      );
      
      console.log('✅ Logo converted to base64 and embedded');
    } else {
      console.log('⚠️ Logo file not found at:', logoPath);
    }
    
    // Fix any other relative image paths
    bodyContent = bodyContent.replace(
      /src="([^"]+\.(png|jpg|jpeg|gif|svg))"/g,
      (match, imagePath) => {
        // If it's a relative path, try to convert to base64
        if (!imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
          const fullImagePath = path.resolve(__dirname, '../../templates', imagePath);
          if (fs.existsSync(fullImagePath)) {
            try {
              const imageBuffer = fs.readFileSync(fullImagePath);
              const imageBase64 = imageBuffer.toString('base64');
              const extension = path.extname(imagePath).toLowerCase();
              const mimeType = extension === '.png' ? 'image/png' : 
                              extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' :
                              extension === '.gif' ? 'image/gif' :
                              extension === '.svg' ? 'image/svg+xml' : 'image/png';
              const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;
              console.log('✅ Converted image to base64:', imagePath);
              return `src="${imageDataUrl}"`;
            } catch (error) {
              console.log('⚠️ Could not convert image to base64:', imagePath, error);
            }
          }
        }
        return match;
      }
    );
    
  } catch (error) {
    console.error('❌ Error fixing asset paths:', error);
  }
  
  return bodyContent;
}

/**
 * Test if Puppeteer is working correctly
 */
export async function testPuppeteerConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('🧪 Testing Puppeteer connection...');
    const browser = await launchPuppeteer();
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    
    console.log('✅ Puppeteer test successful, PDF size:', pdfBuffer.length);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Puppeteer test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      details: {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      }
    };
  }
}

/**
 * Get system information for debugging
 */
export function getSystemInfo(): any {
  const fs = require('fs');
  const path = require('path');
  
  const possibleChromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/opt/google/chrome/chrome',
    '/usr/local/bin/chrome'
  ];
  
  const chromeStatus = possibleChromePaths.map(chromePath => ({
    path: chromePath,
    exists: chromePath ? fs.existsSync(chromePath) : false
  }));
  
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV,
    chromePaths: chromeStatus,
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH
  };
}
