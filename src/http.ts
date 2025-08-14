import { DaxtraError } from './types.js';
import { ApiErrorExtractor, GenericHttpClient } from './utils/httpClient/http.js';

/**
 * DaXtra-specific error extractor implementation
 */
export class DaxtraErrorExtractor implements ApiErrorExtractor {
  extractError(status: number, responseBody: any): { code?: string | number; message?: string } {
    let code: string | number | undefined;
    let message = `HTTP ${status}`;

    // Try to extract CSERROR information
    if (responseBody && typeof responseBody === 'object' && responseBody.CSERROR) {
      code = responseBody.CSERROR.code;
      message = responseBody.CSERROR.message || message;
    }

    return { code, message };
  }

  createError(status: number, message: string, code?: string | number, responseBody?: any): Error {
    return new DaxtraError(status, message, code, responseBody);
  }
}

/**
 * DaXtra-specific HTTP client with legacy compatibility
 */
export class HttpClient extends GenericHttpClient {
  constructor(baseUrl: string, defaultTimeoutMs: number = 30000) {
    super(baseUrl, defaultTimeoutMs, new DaxtraErrorExtractor());
  }
}
