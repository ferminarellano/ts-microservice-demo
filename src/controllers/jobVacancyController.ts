import { Request, Response, NextFunction } from 'express';
import { JobVacancyService } from '../services/jobVacancyService.js';
import { ApiResponse, VacancyResponse } from '../utils/responseTypes.js';
import { createFileInfo } from '../utils/responseHelpers.js';

export class JobVacancyController {
  constructor(private jobVacancyService: JobVacancyService) {}

  parseVacancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const profile = await this.jobVacancyService.parseJobOrder(
        req.file.buffer, 
        req.file.originalname
      );

      const response: ApiResponse<VacancyResponse> = {
        success: true,
        data: {
          parsing_method: 'vacancy',
          file_info: createFileInfo(req.file),
          profile
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
