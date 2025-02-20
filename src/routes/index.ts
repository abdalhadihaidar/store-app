import express from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import usersRoutes from './user.routes';
import imageupladRoutes from './imageUpload.routes';
import statsRoutes from './stats.routes';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/users', usersRoutes);
router.use('/upload',imageupladRoutes);
router.use('/stats', statsRoutes);
export default router;
