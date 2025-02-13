"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
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
router.get('/', category_controller_1.CategoryController.getCategories);
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
router.get('/:id', category_controller_1.CategoryController.getById);
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category (Admin Only)
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
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', (0, auth_middleware_1.authMiddleware)(['admin']), category_controller_1.CategoryController.createCategory);
/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category (Admin Only)
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
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', (0, auth_middleware_1.authMiddleware)(['admin']), category_controller_1.CategoryController.updateCategory);
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
router.delete('/:id', (0, auth_middleware_1.authMiddleware)(['admin']), category_controller_1.CategoryController.deleteCategory);
exports.default = router;
