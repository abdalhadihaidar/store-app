import express from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
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
router.get('/', ProductController.getProducts);

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
router.get('/:id', ProductController.getById);

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
router.get('/category/:categoryId', ProductController.getProductsByCategoryId);
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *               - quantity
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  '/',
  /* authMiddleware(['admin']), */
  ProductController.createProduct // ✅ Now type-safe
);

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
router.put('/:id', /* authMiddleware(['admin']), */ ProductController.updateProduct);

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
router.delete('/:id', /* authMiddleware(["admin"]), */ ProductController.deleteProduct);

/**
 * @swagger
 * /products/{id}/calculate-packages:
 *   get:
 *     tags:
 *       - Products
 *     summary: Calculate required packages for a desired quantity
 *     description: Calculate how many packages are needed to fulfill a specific quantity requirement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *         description: Desired quantity
 *         example: 50
 *     responses:
 *       200:
 *         description: Calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packagesNeeded:
 *                   type: integer
 *                   description: Number of packages required
 *                   example: 2
 *                 totalUnits:
 *                   type: integer
 *                   description: Total units provided by the packages
 *                   example: 100
 *                 excessUnits:
 *                   type: integer
 *                   description: Extra units beyond requested quantity
 *                   example: 50
 *                 isSufficient:
 *                   type: boolean
 *                   description: If available packages meet the requirement
 *                   example: true
 *                 availablePackages:
 *                   type: integer
 *                   description: Current packages in stock
 *                   example: 5
 *       400:
 *         description: Invalid input parameters
 *       404:
 *         description: Product not found
 */
router.get('/:id/calculate-packages', ProductController.calculatePackages);

/**
 * @swagger
 * /products/quantity:
 *   post:
 *     tags: [Products]
 *     summary: Create product with direct quantity
 *     description: Create product specifying quantity directly (packages and items per package will be set to 0)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *               - quantity
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 */
router.post('/quantity', ProductController.createProductWithQuantity);

export default router;
