"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000'; // Default to localhost if not set
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Store API',
            version: '1.0.0',
            description: 'API documentation for the store system',
        },
        servers: [{ url: `${SERVER_URL}/api` }],
    },
    apis: ['./src/routes/*.ts'], // Path to API docs
};
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
};
exports.setupSwagger = setupSwagger;
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
