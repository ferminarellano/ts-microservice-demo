import { Router } from 'express';
import { ResumeParsingController } from '../controllers/resumeParsingController.js';
import { ResumeParsingService } from '../services/resumeParsingService.js';
import { upload } from '../middlewares/index.js';

const router = Router();
const resumeParsingService = new ResumeParsingService();
const resumeParsingController = new ResumeParsingController(resumeParsingService);

router.post('/full', upload.single('file'), resumeParsingController.parseFullResume);
router.post('/two-phase', upload.single('file'), resumeParsingController.parseTwoPhase);

export default router;
