"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imageUpload_controller_1 = require("../controllers/imageUpload.controller");
const router = express_1.default.Router();
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
router.post('/', imageUpload_controller_1.ImageUploadController.uploadImages);
exports.default = router;
