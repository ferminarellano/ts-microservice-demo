import { Router } from 'express';
import { JobVacancyController } from '../controllers/jobVacancyController.js';
import { JobVacancyService } from '../services/jobVacancyService.js';
import { upload } from '../middlewares/index.js';

const router = Router();
const jobVacancyService = new JobVacancyService();
const jobVacancyController = new JobVacancyController(jobVacancyService);

router.post('/', upload.single('file'), jobVacancyController.parseVacancy);

export default router;
