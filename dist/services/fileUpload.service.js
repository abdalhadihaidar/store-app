"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalImageUpload = exports.categoryImageUpload = exports.productImageUpload = void 0;
// fileUpload.service.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(UPLOADS_DIR))
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
    }
});
const fileFilter = (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new multer_1.default.MulterError('LIMIT_UNEXPECTED_FILE'));
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 1024, files: 4 }
});
// Export specific middleware instances
exports.productImageUpload = upload.array('images', 4);
exports.categoryImageUpload = upload.single('image');
exports.generalImageUpload = upload.array('images'); // For image upload controller
