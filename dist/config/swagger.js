"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
// src/config/swagger.ts
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Store API',
            version: '1.0.0',
            description: 'API documentation for the store system',
        },
        servers: [{ url: `${SERVER_URL}/api` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        path_1.default.join(process.cwd(), 'src/routes/*.ts'),
        path_1.default.join(process.cwd(), 'dist/routes/*.js')
    ]
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
        explorer: true,
        swaggerOptions: {
            url: '/api-docs.json'
        }
    }));
};
exports.setupSwagger = setupSwagger;
