import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import resumeRoutes from './resumeRoutes.js';
import jobVacancyRoutes from './jobVacancyRoutes.js';
import conversionRoutes from './conversionRoutes.js';

export const createApiRoutes = (): Router => {
  const router = Router();

  // Mount all route modules
  router.use('/health', healthRoutes);
  router.use('/api/v1/parse/resume', resumeRoutes);
  router.use('/api/v1/parse/vacancy', jobVacancyRoutes);
  router.use('/api/v1/convert', conversionRoutes);

  return router;
};
