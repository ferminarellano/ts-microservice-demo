import { request } from 'undici';

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** JWT token for authentication */
  jwt?: string;
}

/**
 * Generic error class for HTTP client errors
 */
export class HttpClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string | number,
    public responseBody?: any
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

/**
 * Interface for extracting API-specific error information from responses
 */
export interface ApiErrorExtractor {
  extractError(status: number, responseBody: any): { code?: string | number; message?: string };
  createError(status: number, message: string, code?: string | number, responseBody?: any): Error;
}

/**
 * Generic HTTP client with retry logic, timeouts, and pluggable error handling
 */
export class GenericHttpClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;
  private errorExtractor?: ApiErrorExtractor;

  constructor(
    baseUrl: string, 
    defaultTimeoutMs: number = 30000,
    errorExtractor?: ApiErrorExtractor
  ) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.errorExtractor = errorExtractor;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async request(
    method: string,
    path: string,
    options: HttpRequestOptions & {
      body?: any;
      headers?: Record<string, string>;
      isMultipart?: boolean;
      token?: string;
      tokenType?: 'Bearer' | 'JWT' | string;
    } = {}
  ): Promise<any> {
    const {
      timeoutMs = this.defaultTimeoutMs,
      jwt,
      token,
      tokenType = 'Bearer',
      body,
      headers = {},
      isMultipart = false,
    } = options;

    const url = `${this.baseUrl}${path}`;
    const requestHeaders: Record<string, string> = { ...headers };

    // Handle authentication - support both new token format and legacy JWT
    if (token) {
      if (tokenType === 'Bearer') {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        requestHeaders[tokenType] = token;
      }
    } else if (jwt) {
      // Legacy JWT support for backward compatibility
      requestHeaders['JWT'] = jwt;
    }

    // Set content type if not multipart
    if (!isMultipart && body && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let lastError: Error | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const requestOptions: any = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (body) {
          if (isMultipart) {
            // For multipart, body should already be FormData
            requestOptions.body = body;
          } else {
            requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
          }
        }

        const response = await request(url, requestOptions);
        clearTimeout(timeoutId);

        const responseBody = await this.parseResponseBody(response);
        
        if (response.statusCode >= 400) {
          const error = this.createError(response.statusCode, responseBody);
          
          // Retry on 429 and 5xx errors
          if (this.shouldRetry(response.statusCode) && attempt < maxAttempts) {
            lastError = error;
            await this.delay(this.calculateBackoff(attempt));
            continue;
          }
          
          throw error;
        }

        return responseBody;

      } catch (error) {
        if (error instanceof Error && error.name === 'HttpClientError') {
          throw error;
        }

        lastError = error as Error;
        
        // For network errors, retry if not last attempt
        if (attempt < maxAttempts) {
          await this.delay(this.calculateBackoff(attempt));
          continue;
        }
      }
    }

    // If we get here, all attempts failed
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Parse response body - try JSON first, fallback to text
   */
  private async parseResponseBody(response: any): Promise<any> {
    try {
      const text = await response.body.text();
      
      if (!text) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch {
        // If not JSON, return as text
        return text;
      }
    } catch {
      return null;
    }
  }

  /**
   * Create error from HTTP response using pluggable error extractor
   */
  private createError(status: number, responseBody: any): Error {
    if (this.errorExtractor) {
      const errorInfo = this.errorExtractor.extractError(status, responseBody);
      return this.errorExtractor.createError(
        status, 
        errorInfo.message || `HTTP ${status}`, 
        errorInfo.code, 
        responseBody
      );
    }

    // Default error creation
    return new HttpClientError(status, `HTTP ${status}`, undefined, responseBody);
  }

  /**
   * Determine if we should retry based on status code
   */
  private shouldRetry(statusCode: number): boolean {
    return statusCode === 429 || statusCode >= 500;
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3; // 30% jitter
    return exponentialDelay * (1 + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
