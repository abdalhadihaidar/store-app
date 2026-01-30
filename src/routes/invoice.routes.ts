import express from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/:orderId', /* authMiddleware(), */ InvoiceController.createInvoice);
router.get('/', /* authMiddleware(), */ InvoiceController.getAllInvoices);
router.get('/:id', /* authMiddleware(), */ InvoiceController.getInvoiceById);
router.get('/:id/download', /* authMiddleware(), */ InvoiceController.downloadInvoice);
router.put('/:id', /* authMiddleware(), */ InvoiceController.updateInvoice);
router.delete('/:id', /* authMiddleware(), */ InvoiceController.deleteInvoice);

export default router;
