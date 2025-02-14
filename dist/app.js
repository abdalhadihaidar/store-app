"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const database_1 = __importDefault(require("./config/database"));
const swagger_1 = require("./config/swagger");
const error_middleware_1 = require("./middleware/error.middleware"); // Import error handler
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use('/uploads', express_1.default.static('uploads')); // ✅ Serve images from the uploads folder
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins (not recommended for production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'patch'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(body_parser_1.default.json());
app.use('/api', routes_1.default);
// Setup Swagger
(0, swagger_1.setupSwagger)(app);
// Error Handling Middleware (MUST be placed after routes)
app.use(error_middleware_1.errorHandler);
exports.default = app;
// Sync database
database_1.default.sync({ alter: true }).then(() => {
    console.log('✅ Database schema updated!');
});
