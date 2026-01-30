import express from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/products', /* authMiddleware(['admin']), */ StatsController.getProductCount);
router.get('/categories', /* authMiddleware(['admin']), */ StatsController.getCategoryCount);
router.get('/orders/pending', /* authMiddleware(['admin']), */ StatsController.getPendingOrders);
router.get('/orders/delivered', /* authMiddleware(['admin']), */ StatsController.getDeliveredOrders);

export default router;