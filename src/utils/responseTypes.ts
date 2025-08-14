export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  type: string;
  code?: string;
  message: string;
  status?: number;
}

export interface FileInfo {
  original_name: string;
  size_kb: number;
  mime_type: string;
}

export interface CompetencySummary {
  name: string;
  level: number;
  proficiency: string;
}

export interface ParsedResumeResponse {
  parsing_method: string;
  file_info: FileInfo;
  profile: any;
  competencies?: any[];
  summary?: {
    total_competencies: number;
    top_skills: CompetencySummary[];
  };
}

export interface TwoPhaseResumeResponse {
  parsing_method: string;
  file_info: FileInfo;
  personal: any;
  full: any;
  competencies?: any[];
  summary?: {
    total_competencies: number;
    top_skills: CompetencySummary[];
  };
}

export interface VacancyResponse {
  parsing_method: string;
  file_info: FileInfo;
  profile: any;
}

export interface ConversionResponse {
  html: string;
  file_info: FileInfo;
  conversion_options: {
    high_quality: boolean;
  };
}
