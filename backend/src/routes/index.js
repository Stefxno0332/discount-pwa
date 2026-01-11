import { Router } from 'express';
import productsRouter from './products.js';
import usersRouter from './users.js';
import adminRouter from './admin.js';

const router = Router();

router.use('/products', productsRouter);
router.use('/users', usersRouter);
router.use('/', adminRouter);

export default router;
