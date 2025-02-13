import express from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */




/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status (Admin Only)
 *     tags: [Orders]
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
 *                 enum: [pending, completed]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.put('/:id', authMiddleware(['admin']), OrderController.updateOrderStatus);


/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve all orders (Admin) or user orders (Client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */

router.get('/', authMiddleware(['admin', 'user']), OrderController.getAllOrders);

/**
 * @swagger
 * /orders:
 *   get by id:
 *     summary: Retrieve all orders (Admin) or user orders (Client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */

router.get('/:id', OrderController.getById);
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order (User)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       example: 2
 *                     quantity:
 *                       type: integer
 *                       example: 3
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authMiddleware(['user']), OrderController.createOrder);

/**
 * @swagger
 * /orders/{id}/approve:
 *   put:
 *     summary: Approve an order and modify item prices (Admin)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                       example: 5
 *                     newPrice:
 *                       type: number
 *                       example: 15.00
 *     responses:
 *       200:
 *         description: Order approved
 */
router.put('/:id/approve', authMiddleware(['admin']), OrderController.approveOrder);

/**
 * @swagger
 * /orders/{id}/complete:
 *   put:
 *     summary: Finalize an order (Admin)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order completed
 */
router.put('/:id/complete', authMiddleware(['admin']), OrderController.completeOrder);
export default router;
