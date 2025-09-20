import express from 'express';
import { ImageUploadController } from '../controllers/imageUpload.controller';

const router = express.Router();

/**
 * @swagger
 * /upload/validate:
 *   post:
 *     summary: Validate image paths sent from frontend
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imagePaths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 4
 *     responses:
 *       200:
 *         description: Image paths validated successfully
 *       400:
 *         description: Invalid image paths
 */
router.post('/validate', ImageUploadController.validateImagePaths);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Legacy upload endpoint (deprecated)
 *     tags: [Uploads]
 *     responses:
 *       410:
 *         description: Endpoint deprecated - use frontend upload service
 */
router.post('/', ImageUploadController.uploadImages);

export default router;
