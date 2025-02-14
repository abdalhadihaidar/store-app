"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const fileUpload_service_1 = require("../services/fileUpload.service");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', product_controller_1.ProductController.getProducts);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', product_controller_1.ProductController.getById);
/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Get products by category ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products in the category
 */
router.get('/category/:categoryId', product_controller_1.ProductController.getProductsByCategoryId);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Admin Only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', (0, auth_middleware_1.authMiddleware)(['admin']), fileUpload_service_1.upload.array('images', 4), product_controller_1.ProductController.createProduct);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product (Admin Only)
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', (0, auth_middleware_1.authMiddleware)(['admin']), product_controller_1.ProductController.updateProduct);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (Admin Only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Product deleted successfully
 */
router.delete('/:id', (0, auth_middleware_1.authMiddleware)(["admin"]), product_controller_1.ProductController.deleteProduct);
exports.default = router;
