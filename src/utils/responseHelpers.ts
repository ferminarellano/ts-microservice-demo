import { FileInfo, CompetencySummary } from './responseTypes.js';

export const createFileInfo = (file: Express.Multer.File): FileInfo => ({
  original_name: file.originalname,
  size_kb: Math.round(file.size / 1024),
  mime_type: file.mimetype
});

export const createCompetencySummary = (competencies: any[]): { total_competencies: number; top_skills: CompetencySummary[] } => ({
  total_competencies: competencies.length,
  top_skills: competencies
    .filter(c => c.skillLevel && c.skillLevel >= 8)
    .slice(0, 10)
    .map(c => ({
      name: c.skillName,
      level: c.skillLevel,
      proficiency: c.skillProficiency
    }))
});
