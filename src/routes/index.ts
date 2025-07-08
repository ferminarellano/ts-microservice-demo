import { Router } from 'express';
import healthRoutes from './healthRoutes';

const router = Router();

router.use('/healthz', healthRoutes);

export default router;
