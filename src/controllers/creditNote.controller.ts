import { Request, Response, NextFunction } from 'express';
import { CreditNoteService } from '../services/creditNote.service';
import { createReadStream } from 'fs';

export class CreditNoteController {
  static async createCreditNote(req: Request, res: Response, next: NextFunction) {
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
      const credit = await CreditNoteService.create(orderId, createdBy);

      if (!credit.pdfPath) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF for credit note'
        });
        return;
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(credit.pdfPath)) {
        res.status(500).json({
          success: false,
          message: 'PDF file was not created properly'
        });
        return;
      }

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=credit_note_${credit.number}.pdf`
      );

      const stream = createReadStream(credit.pdfPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Error streaming credit note PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading PDF file'
          });
        }
      });
       
    } catch (error: any) {
      console.error('Error creating credit note:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || 'Failed to create credit note'
        });
      }
    }
  }

  static async getAllCreditNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const size = Number(req.query.size) || 25;

      const { count, rows } = await CreditNoteService.getAll(page, size);

      res.json({ total: count, page, size, data: rows });
    } catch (error) {
      console.error('Error retrieving credit notes:', error);
      res.status(500).json({
        error: {
          message: error instanceof Error ? error.message : 'read ECONNRESET',
        },
      });
    }
  }

  static async getCreditNoteById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      const credit = await CreditNoteService.getById(id);
      res.json(credit);
    } catch (error) {
      next(error);
    }
  }

  static async updateCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      const credit = await CreditNoteService.update(id, req.body);
      res.json(credit);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new Error('Invalid id');
      await CreditNoteService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async downloadCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid credit note ID'
        });
        return;
      }
      
      const credit = await CreditNoteService.getById(id);
      if (!credit) {
        res.status(404).json({
          success: false,
          message: 'Credit note not found'
        });
        return;
      }
      
      if (!credit.pdfPath) {
        res.status(404).json({
          success: false,
          message: 'PDF file not found for this credit note'
        });
        return;
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(credit.pdfPath)) {
        res.status(404).json({
          success: false,
          message: 'PDF file does not exist on server'
        });
        return;
      }

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=credit_note_${credit.number}.pdf`
      );

      const stream = createReadStream(credit.pdfPath);
      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Error streaming credit note PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading PDF file'
          });
        }
      });
       
    } catch (error: any) {
      console.error('Error downloading credit note PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error?.message || 'Failed to download PDF'
        });
      }
    }
  }
}
