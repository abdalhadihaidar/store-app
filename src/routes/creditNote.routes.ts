import express from 'express';
import { CreditNoteController } from '../controllers/creditNote.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/:orderId', authMiddleware(), CreditNoteController.createCreditNote);
router.get('/', authMiddleware(), CreditNoteController.getAllCreditNotes);
router.get('/:id', authMiddleware(), CreditNoteController.getCreditNoteById);
router.get('/:id/download', authMiddleware(), CreditNoteController.downloadCreditNote);
router.put('/:id', authMiddleware(), CreditNoteController.updateCreditNote);
router.delete('/:id', authMiddleware(), CreditNoteController.deleteCreditNote);

export default router;
