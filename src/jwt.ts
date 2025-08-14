import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import type { BuildJwtOptions, JwtPayload } from './types.js';

/**
 * Build a JWT token for DaXtra API authentication using HS256 algorithm
 * 
 * @param options - JWT building options
 * @returns Promise resolving to signed JWT string
 * 
 * @example
 * ```typescript
 * const token = await buildJwt({
 *   account: 'my-account',
 *   secret: 'shared-secret',
 *   ttlSeconds: 120
 * });
 * ```
 */
export async function buildJwt(options: BuildJwtOptions): Promise<string> {
  const { account, secret, ttlSeconds } = options;
  
  // Calculate timestamps in seconds
  const nowSec = Math.floor(Date.now() / 1000);
  const iat = nowSec;
  const exp = iat + ttlSeconds;
  const jti = uuidv4();

  // Create JWT payload with string index signature for jose compatibility
  const payload: JwtPayload & { [key: string]: string | number } = {
    account,
    iat,
    exp,
    jti,
  };

  // Convert secret to Uint8Array for jose
  const secretKey = new TextEncoder().encode(secret);

  try {
    // Sign JWT with HS256
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setJti(jti)
      .sign(secretKey);

    return jwt;
  } catch (error) {
    throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
