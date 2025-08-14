import { Router } from 'express';
import { ConversionController } from '../controllers/conversionController.js';
import { ConversionService } from '../services/conversionService.js';
import { upload } from '../middlewares/index.js';

const router = Router();
const conversionService = new ConversionService();
const conversionController = new ConversionController(conversionService);

router.post('/html', upload.single('file'), conversionController.convertToHtml);

export default router;
