import express from 'express';
import { ImageUploadController } from '../controllers/imageUpload.controller';

const router = express.Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload images before linking them to a product/category
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 */
router.post('/', ImageUploadController.uploadImages);

export default router;
