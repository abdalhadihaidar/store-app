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
 * /orders:
 *   get:
 *     summary: Retrieve all orders
 *     description: Admin can view all orders, while clients can only view their own orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 */
router.get('/', authMiddleware(['admin', 'client']), OrderController.getAllOrders);


/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Retrieve all reurns
 *     description: Admin can view all reurns, while clients can only view their own returns.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of returns retrieved successfully
 */
router.get('/returns', authMiddleware(['admin']), OrderController.getAllReturns);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve details of a specific order.
 *     tags: [Orders]
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
 *         description: Order details retrieved successfully
 */
router.get('/:id', authMiddleware(['admin', 'client']), OrderController.getById);

/**
 * @swagger
 * /orders/{id}/returns:
 *   post:
 *     summary: Request return for order items
 *     description: Create a return request for specific items in an order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                     reason:
 *                       type: string
 *     responses:
 *       201:
 *         description: Return request created
 */
router.post('/:id/returns', authMiddleware(['admin','client']), OrderController.createReturn);

/**
 * @swagger
 * /orders/{id}/details:
 *   get:
 *     summary: Get full order details
 *     description: Retrieve complete order details including items, store information, user details, and a price breakdown.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Complete order details with price breakdown
 */
router.get('/:id/details', authMiddleware(['admin', 'client']), OrderController.getOrderDetails);

/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     description: Retrieve all orders for a specific user.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders for the user
 */
router.get('/user/:userId', authMiddleware(['admin', 'client']), OrderController.getOrdersByUserId);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (Client Only)
 *     description: |
 *       Users can place an order by providing product details, store ID, and optional flags for price change requests and POS orders.
 *       
 *       **Workflow:**
 *       - **POS Orders (`isPOS: true`):**  
 *         The order is immediately created with status **completed**. Taxes for each order item are calculated automatically.
 *       
 *       - **Non-POS Orders (`isPOS: false`):**  
 *         The order is created with status **new**. The admin later adds the tax values and adjusted prices, updating the order status to **pending**.  
 *         The client then reviews the offer (with the adjusted prices and taxes) and approves it, which updates the order status to **approved**.  
 *         Finally, the admin finalizes the order by marking it as **completed**.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 *               storeId:
 *                 type: integer
 *                 example: 2
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       example: 3
 *                     quantity:
 *                       type: integer
 *                       example: 5
 *                     isPackage:
 *                       type: boolean
 *                       example: false
 *               isPriceChangeRequested:
 *                 type: boolean
 *                 example: true
 *               isPOS:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authMiddleware(['client']), OrderController.createOrder);

/**
 * @swagger
 * /orders/{id}/approve:
 *   put:
 *     summary: Approve and adjust order prices (Admin Only)
 *     description: |
 *       For non-POS orders, the admin approves an order by providing updated item prices.
 *       This endpoint updates each order item's tax amount and adjusted price based on the new values,
 *       then sets the order status to **approved**.
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
 *         description: Order approved successfully (status updated to approved)
 */
router.put('/:id/approve', authMiddleware(['admin']), OrderController.approveOrder);

/**
 * @swagger
 * /orders/{id}/complete:
 *   put:
 *     summary: Finalize the order (Admin Only)
 *     description: |
 *       Finalizes an order.
 *       - For non-POS orders, this endpoint marks the order as **completed** after the client has approved the offer.
 *       - For POS orders, the order is already marked as **completed** at creation.
 *     tags: [Orders]
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
 *         description: Order marked as completed successfully
 */
router.put('/:id/complete', authMiddleware(['admin']), OrderController.completeOrder);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status (Admin Only)
 *     description: |
 *       Admins can manually update the order status to **pending** or **completed**.
 *       This endpoint is typically used for additional adjustments or corrections.
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

export default router;
