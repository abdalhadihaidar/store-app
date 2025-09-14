import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import Order from '../models/order.model';
import Store from '../models/store.model';
import { User } from '../models/user.model';
import { createReadStream } from 'fs';

export class InvoiceController {
  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
        return;
      }
      
      const createdBy = req.user?.id ?? null;
      
      // Extract data from request body (from print modal)
      const { invoiceNumber, invoiceDate, userName, kundenNr } = req.body;
      
      const printData = {
        invoiceNumber: invoiceNumber as string,
        invoiceDate: invoiceDate as string,
        userName: userName as string,
        kundenNr: kundenNr as string
      };
      
      let invoice = await InvoiceService.create(orderId, createdBy, printData);

      if (!invoice.pdfPath) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF for invoice'
        });
        return;
      }

      // Check if file exists, if not try to regenerate
      const fs = require('fs');
      if (!fs.existsSync(invoice.pdfPath)) {
        console.log('🔄 Invoice PDF not found, attempting to regenerate...');
        try {
          // Regenerate the invoice PDF
          const { InvoiceService } = await import('../services/invoice.service');
          const regeneratedInvoice = await InvoiceService.create(orderId, createdBy, printData);
          
          if (!regeneratedInvoice.pdfPath || !fs.existsSync(regeneratedInvoice.pdfPath)) {
            res.status(500).json({
              success: false,
              message: 'PDF file was not created properly'
            });
            return;
          }
          
          // Update the invoice with the new path
          invoice = regeneratedInvoice;
          console.log('✅ Invoice PDF regenerated successfully:', invoice.pdfPath);
        } catch (regenerateError: any) {
          console.error('❌ Failed to regenerate invoice PDF:', regenerateError);
          res.status(500).json({
            success: false,
            message: 'PDF file was not created properly and could not be regenerated'
          });
          return;
        }
      }

      // load related data for response headers (optional)
      await invoice.reload({
        include: [
          {
            model: Order,
            as: 'order',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name'] },
              { model: Store, as: 'store', attributes: ['id', 'name'] },
            ],
          },
        ],
      });

      // Check if it's an HTML fallback file
      const isHtmlFile = invoice.pdfPath.endsWith('.html');
      
      // stream PDF/HTML back to client
      res.setHeader('Content-Type', isHtmlFile ? 'text/html' : 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${invoice.number}.${isHtmlFile ? 'html' : 'pdf'}`
      );

      const stream = createReadStream(invoice.pdfPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Error streaming invoice PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading PDF file'
          });
        }
      });
       
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || 'Failed to create invoice'
        });
      }
    }
  }

  static async getAllInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const size = Number(req.query.size) || 25;

      const { count, rows } = await InvoiceService.getAll(page, size);

      res.json({ total: count, page, size, data: rows });
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : 'read ECONNRESET',
        },
      });
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      const invoice = await InvoiceService.getById(id);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      const invoice = await InvoiceService.update(id, req.body);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      await InvoiceService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid invoice ID'
        });
        return;
      }
      
      let invoice = await InvoiceService.getById(id);
      if (!invoice) {
        res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
        return;
      }
      
      if (!invoice.pdfPath) {
        res.status(404).json({
          success: false,
          message: 'PDF file not found for this invoice'
        });
        return;
      }

      // Check if file exists, if not try to regenerate
      const fs = require('fs');
      if (!fs.existsSync(invoice.pdfPath)) {
        console.log('🔄 Invoice PDF not found, attempting to regenerate...');
        try {
          // Regenerate the PDF for the existing invoice (don't create new invoice)
          const { InvoiceService } = await import('../services/invoice.service');
          const regeneratedInvoice = await InvoiceService.regeneratePdf(invoice.id);
          
          if (!regeneratedInvoice || !regeneratedInvoice.pdfPath || !fs.existsSync(regeneratedInvoice.pdfPath)) {
            res.status(404).json({
              success: false,
              message: 'PDF file does not exist on server and could not be regenerated'
            });
            return;
          }
          
          // Use the regenerated invoice
          invoice = regeneratedInvoice;
          console.log('✅ Invoice PDF regenerated successfully:', invoice.pdfPath);
        } catch (regenerateError: any) {
          console.error('❌ Failed to regenerate invoice PDF:', regenerateError);
          res.status(404).json({
            success: false,
            message: 'PDF file does not exist on server and could not be regenerated'
          });
          return;
        }
      }

      // Check if it's an HTML fallback file
      const isHtmlFile = invoice.pdfPath.endsWith('.html');
      
      // stream PDF/HTML back to client
      res.setHeader('Content-Type', isHtmlFile ? 'text/html' : 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${invoice.number}.${isHtmlFile ? 'html' : 'pdf'}`
      );

      const stream = createReadStream(invoice.pdfPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Error streaming invoice PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading PDF file'
          });
        }
      });
       
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || 'Failed to download PDF'
        });
      }
    }
  }
}
