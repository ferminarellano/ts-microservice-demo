import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildJwt } from '../src/jwt.js';
import { DaxtraParserClient, DaxtraError, extractCompetencies } from '../src/index.js';

describe('JWT Helper', () => {
  it('should build a valid JWT with required claims', async () => {
    const options = {
      account: 'test-account',
      secret: 'test-secret',
      ttlSeconds: 120
    };

    const jwt = await buildJwt(options);
    expect(jwt).toBeDefined();
    expect(typeof jwt).toBe('string');
    
    // JWT should have 3 parts separated by dots
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);

    // Decode header and payload to verify structure
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    expect(header.alg).toBe('HS256');
    expect(payload.account).toBe('test-account');
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.jti).toBeDefined();
    expect(payload.exp - payload.iat).toBe(120);
  });

  it('should generate unique JTI for each token', async () => {
    const options = {
      account: 'test-account',
      secret: 'test-secret',
      ttlSeconds: 60
    };

    const jwt1 = await buildJwt(options);
    const jwt2 = await buildJwt(options);

    const payload1 = JSON.parse(atob(jwt1.split('.')[1]));
    const payload2 = JSON.parse(atob(jwt2.split('.')[1]));

    expect(payload1.jti).not.toBe(payload2.jti);
  });
});

describe('DaxtraError', () => {
  it('should create error with all properties', () => {
    const responseBody = { CSERROR: { code: 'E001', message: 'Test error' } };
    const error = new DaxtraError(400, 'Bad Request', 'E001', responseBody);

    expect(error.name).toBe('DaxtraError');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.code).toBe('E001');
    expect(error.responseBody).toEqual(responseBody);
  });
});

describe('extractCompetencies', () => {
  it('should extract competencies from candidate profile', () => {
    const mockProfile = {
      StructuredResume: {
        Competency: [
          {
            skillName: 'JavaScript',
            skillLevel: 8,
            skillProficiency: 'EXCELLENT',
            auth: true,
            skillAliasArray: ['JS', 'ECMAScript']
          },
          {
            skillName: 'Python',
            skillLevel: 7,
            skillProficiency: 'GOOD'
          }
        ]
      }
    };

    const competencies = extractCompetencies(mockProfile);
    
    expect(competencies).toHaveLength(2);
    expect(competencies[0].skillName).toBe('JavaScript');
    expect(competencies[0].skillLevel).toBe(8);
    expect(competencies[0].skillProficiency).toBe('EXCELLENT');
    expect(competencies[0].auth).toBe(true);
    expect(competencies[0].skillAliasArray).toEqual(['JS', 'ECMAScript']);
    
    expect(competencies[1].skillName).toBe('Python');
    expect(competencies[1].skillLevel).toBe(7);
  });

  it('should handle single competency (not array)', () => {
    const mockProfile = {
      StructuredResume: {
        Competency: {
          skillName: 'TypeScript',
          skillLevel: 9
        }
      }
    };

    const competencies = extractCompetencies(mockProfile);
    expect(competencies).toHaveLength(1);
    expect(competencies[0].skillName).toBe('TypeScript');
    expect(competencies[0].skillLevel).toBe(9);
  });

  it('should return empty array when no competencies', () => {
    const mockProfile = { StructuredResume: {} };
    const competencies = extractCompetencies(mockProfile);
    expect(competencies).toEqual([]);
  });

  it('should handle malformed profile gracefully', () => {
    const mockProfile = { invalid: 'data' };
    const competencies = extractCompetencies(mockProfile);
    expect(competencies).toEqual([]);
  });
});

describe('DaxtraParserClient', () => {
  let client: DaxtraParserClient;

  beforeEach(() => {
    client = new DaxtraParserClient({
      baseUrl: 'https://example.com',
      account: 'test-account',
      jwtSecret: 'test-secret',
      turbo: false
    });
  });

  it('should create client with correct configuration', () => {
    expect(client).toBeInstanceOf(DaxtraParserClient);
  });

  it('should handle turbo mode in account string', () => {
    const turboClient = new DaxtraParserClient({
      baseUrl: 'https://example.com',
      account: 'test-account',
      jwtSecret: 'test-secret',
      turbo: true
    });

    expect(turboClient).toBeInstanceOf(DaxtraParserClient);
  });

  // Note: Full integration tests would require actual DaXtra API credentials
  // These are basic unit tests to verify the SDK structure
});

// Mock data for testing
export const mockCandidateProfile = {
  StructuredResume: {
    PersonalDetails: {
      Name: {
        FormattedName: 'John Doe',
        GivenName: 'John',
        FamilyName: 'Doe'
      },
      ContactInfo: {
        EmailAddress: 'john.doe@example.com',
        Telephone: {
          FormattedNumber: '+1-555-123-4567'
        }
      }
    },
    Competency: [
      {
        skillName: 'JavaScript',
        skillLevel: 8,
        skillProficiency: 'EXCELLENT',
        auth: true
      },
      {
        skillName: 'TypeScript',
        skillLevel: 7,
        skillProficiency: 'GOOD'
      }
    ]
  }
};

export const mockVacancyProfile = {
  StructuredResume: {
    JobRequirement: {
      Title: 'Senior Developer',
      CompanyName: 'Tech Corp'
    }
  }
};
