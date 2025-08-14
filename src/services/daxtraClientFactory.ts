import { DaxtraParserClient } from '../index.js';

let clientInstance: DaxtraParserClient | null = null;

export const getDaxtraClient = (): DaxtraParserClient => {
  if (!clientInstance) {
    clientInstance = new DaxtraParserClient({
      baseUrl: process.env.DAXTRA_BASE_URL!,
      account: process.env.DAXTRA_ACCOUNT!,
      jwtSecret: process.env.DAXTRA_JWT_SECRET!,
      turbo: process.env.DAXTRA_TURBO === 'true',
      defaultTimeoutMs: parseInt(process.env.DAXTRA_TIMEOUT_MS || '45000')
    });
  }
  return clientInstance;
};

// For testing - allows injecting a mock client
export const setDaxtraClient = (client: DaxtraParserClient): void => {
  clientInstance = client;
};

export const resetDaxtraClient = (): void => {
  clientInstance = null;
};
