import { Request, Response, NextFunction } from 'express';
import { ResumeParsingService } from '../services/resumeParsingService.js';
import { ApiResponse, ParsedResumeResponse, TwoPhaseResumeResponse } from '../utils/responseTypes.js';
import { createFileInfo, createCompetencySummary } from '../utils/responseHelpers.js';

export class ResumeParsingController {
  constructor(private resumeParsingService: ResumeParsingService) {}

  parseFullResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { profile, competencies } = await this.resumeParsingService.parseFullResume(
        req.file.buffer, 
        req.file.originalname
      );

      const response: ApiResponse<ParsedResumeResponse> = {
        success: true,
        data: {
          parsing_method: 'full',
          file_info: createFileInfo(req.file),
          profile,
          competencies,
          summary: createCompetencySummary(competencies)
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  parseTwoPhase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { personal, full, competencies } = await this.resumeParsingService.parsePersonalThenFull(
        req.file.buffer, 
        req.file.originalname
      );

      const response: ApiResponse<TwoPhaseResumeResponse> = {
        success: true,
        data: {
          parsing_method: 'two-phase',
          file_info: createFileInfo(req.file),
          personal,
          full,
          competencies,
          summary: createCompetencySummary(competencies)
        }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
