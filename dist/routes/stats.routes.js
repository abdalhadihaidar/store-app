"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stats_controller_1 = require("../controllers/stats.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/products', (0, auth_middleware_1.authMiddleware)(['admin']), stats_controller_1.StatsController.getProductCount);
router.get('/categories', (0, auth_middleware_1.authMiddleware)(['admin']), stats_controller_1.StatsController.getCategoryCount);
router.get('/orders/pending', (0, auth_middleware_1.authMiddleware)(['admin']), stats_controller_1.StatsController.getPendingOrders);
router.get('/orders/delivered', (0, auth_middleware_1.authMiddleware)(['admin']), stats_controller_1.StatsController.getDeliveredOrders);
exports.default = router;
