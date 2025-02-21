"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
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
router.put('/:id', (0, auth_middleware_1.authMiddleware)(['admin']), order_controller_1.OrderController.updateOrderStatus);
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
router.get('/', (0, auth_middleware_1.authMiddleware)(['admin', 'client']), order_controller_1.OrderController.getAllOrders);
/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
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
 *         description: Order details
 */
router.get('/:id', (0, auth_middleware_1.authMiddleware)(['admin', 'client']), order_controller_1.OrderController.getById);
/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders for the user
 */
router.get('/user/:userId', (0, auth_middleware_1.authMiddleware)(['admin', 'client']), order_controller_1.OrderController.getOrdersByUserId);
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
router.post('/', (0, auth_middleware_1.authMiddleware)(['client']), order_controller_1.OrderController.createOrder);
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
router.put('/:id/approve', (0, auth_middleware_1.authMiddleware)(['admin']), (req, res, next) => order_controller_1.OrderController.approveOrder(req, res, next));
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
router.put('/:id/complete', (0, auth_middleware_1.authMiddleware)(['admin']), (req, res, next) => order_controller_1.OrderController.completeOrder(req, res, next));
exports.default = router;
