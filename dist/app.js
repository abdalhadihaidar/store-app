"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const database_1 = __importDefault(require("./config/database"));
const swagger_1 = require("./config/swagger");
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins (not recommended for production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'patch'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.urlencoded({ extended: true })); // ✅ Supports form submissions
app.use(express_1.default.json()); // ✅ Correctly parse JSON data
app.use('/uploads', express_1.default.static('uploads')); // ✅ Serve images from the uploads folder
// ❌ DO NOT use bodyParser.json() before file uploads (multer handles it)
// app.use(bodyParser.json()); // ❌ REMOVE THIS
app.use('/api', routes_1.default);
(0, swagger_1.setupSwagger)(app);
app.use(error_middleware_1.errorHandler); // ✅ Add error handler last
exports.default = app;
// Sync database
database_1.default.sync({ alter: true }).then(() => {
    console.log('✅ Database schema updated!');
});
