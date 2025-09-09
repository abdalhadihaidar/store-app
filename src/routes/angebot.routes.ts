import express from 'express';
import { AngebotController } from '../controllers/angebot.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Angebot:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         orderId:
 *           type: integer
 *         angebotNumber:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [draft, sent, accepted, rejected, expired]
 *         totalNet:
 *           type: number
 *         totalVat:
 *           type: number
 *         totalGross:
 *           type: number
 *         notes:
 *           type: string
 *         storeId:
 *           type: integer
 *         customerId:
 *           type: integer
 *     AngebotItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         angebotId:
 *           type: integer
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         packages:
 *           type: integer
 *         unitPrice:
 *           type: number
 *         taxRate:
 *           type: number
 *         taxAmount:
 *           type: number
 *         totalPrice:
 *           type: number
 */

/**
 * @swagger
 * /angebots:
 *   post:
 *     summary: Create angebot from existing order
 *     description: Create an angebot (offer) from an existing order. This allows editing prices, quantities, and taxes before sending to customer.
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *                 description: ID of the order to create angebot from
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: Validity period for the offer (defaults to 30 days)
 *               notes:
 *                 type: string
 *                 description: Additional notes or terms
 *     responses:
 *       201:
 *         description: Angebot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Angebot'
 */
router.post('/', authMiddleware(['admin']), AngebotController.createFromOrder);

/**
 * @swagger
 * /angebots/direct:
 *   post:
 *     summary: Create direct angebot (not from order)
 *     description: Create an angebot directly without an existing order. Useful for custom offers.
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: integer
 *               storeId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     packages:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Angebot created successfully
 */
router.post('/direct', authMiddleware(['admin']), AngebotController.createDirect);

/**
 * @swagger
 * /angebots:
 *   get:
 *     summary: Get all angebots with filtering
 *     description: Retrieve all angebots with optional filtering by store, status, and customer
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storeId
 *         in: query
 *         schema:
 *           type: integer
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft, sent, accepted, rejected, expired]
 *       - name: customerId
 *         in: query
 *         schema:
 *           type: integer
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of angebots retrieved successfully
 */
router.get('/', authMiddleware(['admin', 'client']), AngebotController.getAll);

/**
 * @swagger
 * /angebots/{id}:
 *   get:
 *     summary: Get angebot by ID
 *     description: Retrieve a specific angebot with all its items and related data
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Angebot retrieved successfully
 *       404:
 *         description: Angebot not found
 */
router.get('/:id', authMiddleware(['admin', 'client']), AngebotController.getById);

/**
 * @swagger
 * /angebots/{id}/items:
 *   put:
 *     summary: Update angebot items (prices, quantities, taxes)
 *     description: Update prices, quantities, and taxes for angebot items. This is the main editing functionality.
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *                     packages:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Angebot items updated successfully
 */
router.put('/:id/items', authMiddleware(['admin']), AngebotController.updateItems);

/**
 * @swagger
 * /angebots/{id}/status:
 *   put:
 *     summary: Update angebot status
 *     description: Update the status of an angebot (draft, sent, accepted, rejected, expired)
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, accepted, rejected, expired]
 *     responses:
 *       200:
 *         description: Angebot status updated successfully
 */
router.put('/:id/status', authMiddleware(['admin', 'client']), AngebotController.updateStatus);

/**
 * @swagger
 * /angebots/{id}/convert:
 *   post:
 *     summary: Convert accepted angebot to order
 *     description: Convert an accepted angebot into a final order. This creates the order and links it to the angebot.
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Angebot converted to order successfully
 */
router.post('/:id/convert', authMiddleware(['admin']), AngebotController.convertToOrder);

/**
 * @swagger
 * /angebots/{id}:
 *   delete:
 *     summary: Delete angebot
 *     description: Delete an angebot (only allowed for draft or expired angebots)
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Angebot deleted successfully
 */
router.delete('/:id', authMiddleware(['admin']), AngebotController.delete);

/**
 * @swagger
 * /angebots/customer/{customerId}:
 *   get:
 *     summary: Get angebots by customer ID
 *     description: Retrieve all angebots for a specific customer
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Customer angebots retrieved successfully
 */
router.get('/customer/:customerId', authMiddleware(['admin', 'client']), AngebotController.getByCustomer);

/**
 * @swagger
 * /angebots/{id}/pdf:
 *   get:
 *     summary: Download angebot PDF
 *     description: Download the generated PDF file for an angebot
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Angebot or PDF file not found
 */
router.get('/:id/pdf', authMiddleware(['admin', 'client']), AngebotController.downloadPdf);

/**
 * @swagger
 * /angebots/{id}/regenerate-pdf:
 *   post:
 *     summary: Regenerate angebot PDF (for debugging)
 *     description: Manually regenerate the PDF for an angebot
 *     tags: [Angebots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF regenerated successfully
 *       404:
 *         description: Angebot or order not found
 */
router.post('/:id/regenerate-pdf', authMiddleware(['admin']), AngebotController.regeneratePdf);

export default router;
