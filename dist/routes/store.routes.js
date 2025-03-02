"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const store_controller_1 = require("../controllers/store.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - postalCode
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Best Electronics"
 *         address:
 *           type: string
 *           maxLength: 255
 *           example: "123 Main Street"
 *         city:
 *           type: string
 *           maxLength: 100
 *           example: "Berlin"
 *         postalCode:
 *           type: string
 *           maxLength: 20
 *           example: "10115"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         userId:
 *           type: integer
 */
/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management endpoints
 */
/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', (0, auth_middleware_1.authMiddleware)(['client', 'admin']), store_controller_1.StoreController.createStore);
/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Retrieve all stores
 *     tags: [Stores]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: postalCode
 *         schema:
 *           type: string
 *         description: Filter by postal code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.get('/', store_controller_1.StoreController.getAllStores);
/**
 * @swagger
 * /stores/search:
 *   get:
 *     summary: Search stores by location
 *     tags: [Stores]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: postalCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 *       500:
 *         description: Server error
 */
router.get('/search', store_controller_1.StoreController.searchStores);
/**
 * @swagger
 * /stores/my-store:
 *   get:
 *     summary: Get current user's store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized
 */
router.get('/my-store', (0, auth_middleware_1.authMiddleware)(['client', 'admin']), store_controller_1.StoreController.getMyStore);
/**
 * @swagger
 * /stores/{storeId}:
 *   put:
 *     summary: Update a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       200:
 *         description: Store updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
router.put('/:storeId', (0, auth_middleware_1.authMiddleware)(['client', 'admin']), store_controller_1.StoreController.updateStore);
/**
 * @swagger
 * /stores/{storeId}:
 *   delete:
 *     summary: Delete a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Store deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
router.delete('/:storeId', (0, auth_middleware_1.authMiddleware)(['admin']), store_controller_1.StoreController.deleteStore);
exports.default = router;
