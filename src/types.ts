import { z } from 'zod';

/**
 * Error structure returned by DaXtra API
 */
export const CsErrorSchema = z.object({
  CSERROR: z.object({
    code: z.union([z.string(), z.number()]),
    message: z.string().optional(),
  }).optional(),
});

export type CsError = z.infer<typeof CsErrorSchema>;

/**
 * Candidate profile response from DaXtra Parser
 */
export const CandidateProfileSchema = z.object({
  Resume: z.object({
    StructuredResume: z.unknown().optional(),
  }).optional(),
  StructuredResume: z.unknown().optional(), // Fallback for direct format
  CSERROR: z.object({
    code: z.union([z.string(), z.number()]),
    message: z.string().optional(),
  }).optional(),
  full_profile_token: z.string().optional(), // legacy field, also used as phase2 token
  phase2_token: z.string().optional(), // used in 2-phase parsing
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

/**
 * Vacancy profile response from DaXtra Parser
 */
export const VacancyProfileSchema = z.object({
  StructuredResume: z.unknown().optional(),
  CSERROR: z.object({
    code: z.union([z.string(), z.number()]),
    message: z.string().optional(),
  }).optional(),
});

export type VacancyProfile = z.infer<typeof VacancyProfileSchema>;

/**
 * Lightweight competency/skill structure
 */
export type CompetencyLite = {
  skillName?: string;
  auth?: boolean;
  skillLevel?: number;
  skillProficiency?: 'BASIC' | 'WORKING' | 'GOOD' | 'EXCELLENT' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE';
  skillAliasArray?: string[];
  lastUsed?: string;
};

/**
 * Custom error for DaXtra API failures
 */
export class DaxtraError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string | number,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = 'DaxtraError';
  }
}

/**
 * Configuration for DaXtra Parser Client
 */
export interface DaxtraClientOptions {
  /** Base URL for DaXtra API (e.g., https://cvxdemo.daxtra.com) */
  baseUrl: string;
  /** DaXtra account identifier */
  account: string;
  /** Shared secret for JWT HS256 signing */
  jwtSecret: string;
  /** Default timeout in milliseconds */
  defaultTimeoutMs?: number;
  /** Enable turbo mode (appends "; -turbo" to account) */
  turbo?: boolean;
}

/**
 * JWT payload structure for DaXtra authentication
 */
export interface JwtPayload {
  /** Account identifier */
  account: string;
  /** Issued at timestamp (seconds) */
  iat: number;
  /** Expiration timestamp (seconds) */
  exp: number;
  /** JWT ID (UUID) */
  jti: string;
}

/**
 * Parameters for building JWT tokens
 */
export interface BuildJwtOptions {
  /** Account identifier */
  account: string;
  /** Shared secret for signing */
  secret: string;
  /** Token time-to-live in seconds */
  ttlSeconds: number;
}

/**
 * Helper function to extract competencies from a candidate profile
 */
export function extractCompetencies(profile: CandidateProfile): CompetencyLite[] {
  try {
    // Check for nested Resume.StructuredResume format (DaXtra response format)
    let resume: any = profile.StructuredResume;
    if (!resume && profile.Resume?.StructuredResume) {
      resume = profile.Resume.StructuredResume;
    }
    
    if (!resume?.Competency) {
      return [];
    }
    
    const competencies = Array.isArray(resume.Competency) 
      ? resume.Competency 
      : [resume.Competency];
      
    return competencies
      .filter((comp: any) => comp && typeof comp === 'object')
      .map((comp: any) => ({
        skillName: comp.skillName,
        auth: comp.auth,
        skillLevel: typeof comp.skillLevel === 'number' ? comp.skillLevel : undefined,
        skillProficiency: comp.skillProficiency,
        skillAliasArray: Array.isArray(comp.skillAliasArray) ? comp.skillAliasArray : undefined,
        lastUsed: comp.lastUsed,
      }));
  } catch {
    return [];
  }
}
