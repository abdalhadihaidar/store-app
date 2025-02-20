"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUploadController = void 0;
const fileUpload_service_1 = require("../services/fileUpload.service");
const multer_1 = __importDefault(require("multer"));
class ImageUploadController {
    static async uploadImages(req, res) {
        (0, fileUpload_service_1.generalImageUpload)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    message: err instanceof multer_1.default.MulterError
                        ? err.code === 'LIMIT_FILE_SIZE'
                            ? 'File too large (max 5MB)'
                            : 'Too many files (max 4)'
                        : 'File upload failed'
                });
            }
            try {
                const files = req.files || [];
                const imagePaths = files.map(file => `/uploads/${file.filename}`);
                res.json({ images: imagePaths });
            }
            catch (error) {
                res.status(500).json({ message: 'Image processing failed' });
            }
        });
    }
}
exports.ImageUploadController = ImageUploadController;
