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
      if (isNaN(orderId)) throw new Error('Invalid orderId');
      const createdBy = req.user?.userId ?? null;
      
      // Extract data from request body (from print modal)
      const { invoiceNumber, invoiceDate, userName, kundenNr } = req.body;
      
      const printData = {
        invoiceNumber: invoiceNumber as string,
        invoiceDate: invoiceDate as string,
        userName: userName as string,
        kundenNr: kundenNr as string
      };
      
      const invoice = await InvoiceService.create(orderId, createdBy, printData);

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

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${invoice.number}.pdf`
      );

      const stream = createReadStream(invoice.pdfPath);
      stream.pipe(res);
       
    } catch (error) {
      next(error);
    }
  }

  static async getAllInvoices(_req: Request, res: Response, next: NextFunction) {
    try {
      const invoices = await InvoiceService.getAll();
      res.json(invoices);
    } catch (error) {
      next(error);
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
      if (isNaN(id)) throw new Error('Invalid id');
      const invoice = await InvoiceService.getById(id);
      
      if (!invoice.pdfPath) {
        throw new Error('PDF file not found');
      }

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${invoice.number}.pdf`
      );

      const stream = createReadStream(invoice.pdfPath);
      stream.pipe(res);
       
    } catch (error) {
      next(error);
    }
  }
}
