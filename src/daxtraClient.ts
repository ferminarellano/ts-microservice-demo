import { FormData } from 'undici';
import { HttpClient } from './http.js';
import { buildJwt } from './jwt.js';
import {
  DaxtraError,
  CandidateProfileSchema,
  VacancyProfileSchema,
  type DaxtraClientOptions,
  type CandidateProfile,
  type VacancyProfile,
} from './types.js';
import { HttpRequestOptions } from './utils/httpClient/http.js';

/**
 * DaXtra Parser REST API Client with JWT authentication
 * 
 * Supports full parsing, 2-phase parsing, vacancy parsing, and HTML conversion.
 */
export class DaxtraParserClient {
  private httpClient: HttpClient;
  private account: string;
  private jwtSecret: string;
  private defaultTimeoutMs: number;
  private turbo: boolean;

  /**
   * Create a new DaXtra Parser client
   * 
   * @param options - Client configuration options
   * 
   * @example
   * ```typescript
   * const client = new DaxtraParserClient({
   *   baseUrl: 'https://cvxdemo.daxtra.com',
   *   account: 'my-account',
   *   jwtSecret: 'shared-secret',
   *   turbo: true
   * });
   * ```
   */
  constructor(options: DaxtraClientOptions) {
    this.httpClient = new HttpClient(options.baseUrl, options.defaultTimeoutMs);
    this.account = options.account;
    this.jwtSecret = options.jwtSecret;
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
    this.turbo = options.turbo || false;
  }

  /**
   * Parse a resume file and return the full candidate profile in one request
   * 
   * @param file - Resume file as Blob, Buffer, or Uint8Array
   * @param filename - Optional filename for the upload
   * @param options - Request options
   * @returns Promise resolving to candidate profile
   * 
   * @example
   * ```typescript
   * import { readFileSync } from 'fs';
   * const file = readFileSync('./resume.pdf');
   * const profile = await client.parseFullResume(file, 'resume.pdf');
   * ```
   */
  async parseFullResume(
    file: Blob | globalThis.Buffer | Uint8Array,
    filename?: string,
    options: HttpRequestOptions = {}
  ): Promise<CandidateProfile> {
    const jwt = await this.generateJwt();
    const formData = new FormData();
    
    // Convert Buffer/Uint8Array to Blob for FormData compatibility
    const fileBlob = file instanceof Blob ? file : new Blob([file]);
    formData.append('file', fileBlob, filename || 'resume');
    formData.append('account', this.getAccountWithTurbo());

    const response = await this.httpClient.request(
      'POST',
      '/cvx/rest/api/v1/profile/full/json',
      {
        ...options,
        jwt,
        body: formData,
        isMultipart: true,
      }
    );

    console.log('Full parsing response type:', typeof response);
    console.log('Full parsing response:', JSON.stringify(response, null, 2).substring(0, 500));

    return this.validateCandidateProfile(response);
  }

  /**
   * Parse a resume using 2-phase parsing: personal info first, then full profile
   * 
   * @param file - Resume file as Blob, Buffer, or Uint8Array
   * @param filename - Optional filename for the upload
   * @param options - Request options
   * @returns Promise resolving to both personal and full candidate profiles
   * 
   * @example
   * ```typescript
   * const { personal, full } = await client.parsePersonalThenFull(fileBuffer);
   * console.log('Name:', personal.StructuredResume?.PersonalDetails?.Name);
   * ```
   */
  async parsePersonalThenFull(
    file: Blob | globalThis.Buffer | Uint8Array,
    filename?: string,
    options: HttpRequestOptions = {}
  ): Promise<{ personal: CandidateProfile; full: CandidateProfile }> {
    // Phase 1: Get personal info and phase2 token
    const jwt = await this.generateJwt();
    
    // Convert file to base64
    const fileBuffer = file instanceof globalThis.Buffer ? file : 
                      file instanceof Uint8Array ? globalThis.Buffer.from(file) :
                      globalThis.Buffer.from(await file.arrayBuffer());
    const base64File = fileBuffer.toString('base64');

    const phase1Response = await this.httpClient.request(
      'POST',
      '/cvx/rest/api/v1/profile/personal/json',
      {
        ...options,
        jwt,
        body: {
          account: this.getAccountWithTurbo(),
          file: base64File,
        },
      }
    );

    const personal = this.validateCandidateProfile(phase1Response);
    
    // Check for phase2_token or fall back to full_profile_token
    const token = personal.phase2_token || personal.full_profile_token;
    
    if (!token) {
      throw new DaxtraError(400, 'No phase2_token or full_profile_token received from personal parsing', undefined, phase1Response);
    }

    // Phase 2: Get full profile using phase2 token
    const jwt2 = await this.generateJwt();
    const phase2Response = await this.httpClient.request(
      'GET',
      `/cvx/rest/api/v1/data?token=${encodeURIComponent(token)}`,
      {
        ...options,
        jwt: jwt2,
      }
    );

    const full = this.validateCandidateProfile(phase2Response);

    return { personal, full };
  }

  /**
   * Parse a job order/vacancy document
   * 
   * @param file - Job order file as Blob, Buffer, or Uint8Array
   * @param filename - Optional filename for the upload
   * @param options - Request options
   * @returns Promise resolving to vacancy profile
   * 
   * @example
   * ```typescript
   * const vacancy = await client.parseJobOrder(jobOrderBuffer, 'job.pdf');
   * ```
   */
  async parseJobOrder(
    file: Blob | globalThis.Buffer | Uint8Array,
    filename?: string,
    options: HttpRequestOptions = {}
  ): Promise<VacancyProfile> {
    const jwt = await this.generateJwt();
    const formData = new FormData();
    
    // Convert Buffer/Uint8Array to Blob for FormData compatibility
    const fileBlob = file instanceof Blob ? file : new Blob([file]);
    formData.append('file', fileBlob, filename || 'joborder');
    formData.append('account', this.getAccountWithTurbo());

    const response = await this.httpClient.request(
      'POST',
      '/cvx/rest/api/v1/joborder/json',
      {
        ...options,
        jwt,
        body: formData,
        isMultipart: true,
      }
    );

    return this.validateVacancyProfile(response);
  }

  /**
   * Convert a document to HTML format
   * 
   * @param file - Document file as Blob, Buffer, or Uint8Array
   * @param highQuality - Whether to use high quality conversion
   * @param filename - Optional filename for the upload
   * @param options - Request options
   * @returns Promise resolving to HTML string
   * 
   * @example
   * ```typescript
   * const html = await client.convertToHtml(fileBuffer, true);
   * ```
   */
  async convertToHtml(
    file: Blob | globalThis.Buffer | Uint8Array,
    highQuality: boolean = false,
    filename?: string,
    options: HttpRequestOptions = {}
  ): Promise<string> {
    const jwt = await this.generateJwt();
    const formData = new FormData();
    
    // Convert Buffer/Uint8Array to Blob for FormData compatibility
    const fileBlob = file instanceof Blob ? file : new Blob([file]);
    formData.append('file', fileBlob, filename || 'document');
    formData.append('account', this.getAccountWithTurbo());

    const endpoint = highQuality ? '/cvx/rest/api/v1/convert2html_q' : '/cvx/rest/api/v1/convert2html';
    
    const response = await this.httpClient.request(
      'POST',
      endpoint,
      {
        ...options,
        jwt,
        body: formData,
        isMultipart: true,
      }
    );

    if (typeof response !== 'string') {
      throw new DaxtraError(500, 'Expected HTML string response from convert2html');
    }

    return response;
  }

  /**
   * Generate a fresh JWT token for API authentication
   * 
   * @param ttlSeconds - Token time-to-live in seconds (default: 120)
   * @returns Promise resolving to JWT string
   */
  private async generateJwt(ttlSeconds: number = 120): Promise<string> {
    return buildJwt({
      account: this.account,
      secret: this.jwtSecret,
      ttlSeconds,
    });
  }

  /**
   * Get account string with turbo suffix if enabled
   */
  private getAccountWithTurbo(): string {
    return this.turbo ? `${this.account}; -turbo` : this.account;
  }

  /**
   * Validate and parse candidate profile response
   */
  private validateCandidateProfile(response: unknown): CandidateProfile {
    try {
      const result = CandidateProfileSchema.parse(response);
      
      // Check for API errors
      if (result.CSERROR) {
        throw new DaxtraError(
          400,
          result.CSERROR.message || 'API returned error',
          result.CSERROR.code,
          response
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof DaxtraError) {
        throw error;
      }
      throw new DaxtraError(500, 'Invalid candidate profile response format', undefined, response);
    }
  }

  /**
   * Validate and parse vacancy profile response
   */
  private validateVacancyProfile(response: unknown): VacancyProfile {
    try {
      const result = VacancyProfileSchema.parse(response);
      
      // Check for API errors
      if (result.CSERROR) {
        throw new DaxtraError(
          400,
          result.CSERROR.message || 'API returned error',
          result.CSERROR.code,
          response
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof DaxtraError) {
        throw error;
      }
      throw new DaxtraError(500, 'Invalid vacancy profile response format', undefined, response);
    }
  }
}
