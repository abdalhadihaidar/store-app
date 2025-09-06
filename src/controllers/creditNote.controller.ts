import { Request, Response, NextFunction } from 'express';
import { CreditNoteService } from '../services/creditNote.service';
import { createReadStream } from 'fs';

export class CreditNoteController {
  static async createCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.orderId);
      if (isNaN(orderId)) throw new Error('Invalid orderId');
      const createdBy = req.user?.id ?? null;
      const credit = await CreditNoteService.create(orderId, createdBy);

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=credit_note_${credit.number}.pdf`
      );

      const stream = createReadStream(credit.pdfPath);
      stream.pipe(res);
       
    } catch (error) {
      next(error);
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
      if (isNaN(id)) throw new Error('Invalid id');
      const credit = await CreditNoteService.getById(id);
      
      if (!credit.pdfPath) {
        throw new Error('PDF file not found');
      }

      // stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=credit_note_${credit.number}.pdf`
      );

      const stream = createReadStream(credit.pdfPath);
      stream.pipe(res);
       
    } catch (error) {
      next(error);
    }
  }
}
