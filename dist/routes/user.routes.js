"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (Admin Only)
 */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve all users (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', (0, auth_middleware_1.authMiddleware)(['admin']), user_controller_1.UserController.getAllUsers);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin Only)
 *     tags: [Users]
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
 *         description: User details
 */
router.get('/:userId', (0, auth_middleware_1.authMiddleware)(['admin']), user_controller_1.UserController.getUserById);
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (Admin Only)
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:userId', (0, auth_middleware_1.authMiddleware)(['admin']), user_controller_1.UserController.updateUser);
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted successfully
 */
router.delete('/:userId', (0, auth_middleware_1.authMiddleware)(['admin']), user_controller_1.UserController.deleteUser);
exports.default = router;
