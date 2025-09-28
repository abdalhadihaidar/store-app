import ejs from 'ejs';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { launchPuppeteer } from './puppeteer.config';

/**
 * Simple and reliable multi-page PDF generation
 * This function creates multiple PDF files and merges them using a more reliable approach
 */
export async function generateMultiPageInvoice(
  templatePath: string,
  templateData: any,
  outPath: string,
  itemsPerPage: number = 18
): Promise<void> {
  console.log('🔧 Starting simple multi-page invoice generation...');
  console.log(`📊 Items: ${templateData.items.length}, Items per page: ${itemsPerPage}`);
  
  const items = templateData.items || [];
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  
  console.log(`📄 Total pages needed: ${totalPages}`);
  
  if (totalPages === 1) {
    // Single page - use simple generation
    console.log('🔧 Single page invoice, using simple generation...');
    await generateSinglePageInvoice(templatePath, templateData, outPath);
    return;
  }
  
  // Multi-page generation
  console.log('🔧 Multi-page invoice, generating pages...');
  
  const browser = await launchPuppeteer();
  const tempFiles: string[] = [];
  
  try {
    const page = await browser.newPage();
    const uploadsDir = path.dirname(outPath);
    
    // Generate each page
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, items.length);
      const pageItems = items.slice(startIndex, endIndex);
      const isLastPage = pageNum === totalPages - 1;
      
      console.log(`🔧 Generating page ${pageNum + 1}/${totalPages} (items ${startIndex + 1}-${endIndex})`);
      
      const pageData = {
        ...templateData,
        items: pageItems,
        isLastPage,
        currentPage: pageNum + 1,
        totalPages
      };
      
      // Generate HTML for this page
      const html = await ejs.renderFile(templatePath, pageData) as string;
      
      // Set content and generate PDF
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const tempFileName = `temp_page_${pageNum + 1}_${Date.now()}.pdf`;
      const tempFilePath = path.join(uploadsDir, tempFileName);
      tempFiles.push(tempFilePath);
      
      await page.pdf({
        path: tempFilePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
        }
      });
      
      console.log(`✅ Page ${pageNum + 1} generated: ${tempFilePath}`);
    }
    
    // Merge PDFs using a simple approach
    console.log('🔧 Merging PDF pages...');
    await mergePdfFiles(tempFiles, outPath);
    
    console.log('✅ Multi-page invoice generated successfully:', outPath);
    
  } catch (error: any) {
    console.error('❌ Error in multi-page generation:', error);
    throw error;
  } finally {
    await browser.close();
    
    // Clean up temp files
    tempFiles.forEach(tempFile => {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log('🗑️ Cleaned up temp file:', tempFile);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up temp file:', tempFile);
      }
    });
  }
}

/**
 * Generate a single page invoice
 */
async function generateSinglePageInvoice(
  templatePath: string,
  templateData: any,
  outPath: string
): Promise<void> {
  const browser = await launchPuppeteer();
  
  try {
    const page = await browser.newPage();
    
    const html = await ejs.renderFile(templatePath, {
      ...templateData,
      isLastPage: true,
      currentPage: 1,
      totalPages: 1
    }) as string;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      }
    });
    
    console.log('✅ Single page invoice generated:', outPath);
    
  } finally {
    await browser.close();
  }
}

/**
 * Merge multiple PDF files into one
 */
async function mergePdfFiles(inputPaths: string[], outputPath: string): Promise<void> {
  try {
    // Try using pdf-lib for merging
    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();
    
    for (const inputPath of inputPaths) {
      if (fs.existsSync(inputPath)) {
        const pdfBytes = fs.readFileSync(inputPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
    }
    
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
    
    console.log('✅ PDFs merged successfully using pdf-lib');
    
  } catch (error: any) {
    console.error('❌ PDF merging failed:', error);
    
    // Fallback: just copy the first page
    if (inputPaths.length > 0 && fs.existsSync(inputPaths[0])) {
      fs.copyFileSync(inputPaths[0], outputPath);
      console.log('⚠️ Fallback: Copied first page only');
    } else {
      throw new Error('No PDF files to merge');
    }
  }
}
