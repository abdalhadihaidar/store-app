import express from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Retrieve all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', CategoryController.getCategories);

/**
 * @swagger
 * /categories:
 *   get by id:
 *     summary: Retrieve all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/:id', CategoryController.getById);
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category with image path (Admin Only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: Image path from frontend upload
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', /* authMiddleware(['admin']), */ CategoryController.createCategoryWithImagePath);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category with image path (Admin Only)
 *     tags: [Categories]
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
 *               image:
 *                 type: string
 *                 description: Image path from frontend upload
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', /* authMiddleware(['admin']), */ CategoryController.updateCategoryWithImagePath);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin Only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete('/:id', /* authMiddleware(['admin']), */ CategoryController.deleteCategory);

export default router;
