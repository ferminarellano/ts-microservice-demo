import { Request, Response, NextFunction } from 'express';
import { ConversionService } from '../services/conversionService.js';
import { ApiResponse, ConversionResponse } from '../utils/responseTypes.js';
import { createFileInfo } from '../utils/responseHelpers.js';

export class ConversionController {
  constructor(private conversionService: ConversionService) {}

  convertToHtml = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const highQuality = this.conversionService.parseHighQualityOption(req.body, req.query);
      const html = await this.conversionService.convertToHtml(
        req.file.buffer, 
        highQuality, 
        req.file.originalname
      );

      const response: ApiResponse<ConversionResponse> = {
        success: true,
        data: {
          html,
          file_info: createFileInfo(req.file),
          conversion_options: {
            high_quality: highQuality
          }
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
