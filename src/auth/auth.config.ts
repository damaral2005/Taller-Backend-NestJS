export interface AuthEnvironment {
  JWT_SECRET: string;
  TOTP_ENCRYPTION_KEY: string;
}

export function validateAuthEnvironment(
  environment: Record<string, unknown>,
): AuthEnvironment {
  const jwt = environment.JWT_SECRET;
  const key = environment.TOTP_ENCRYPTION_KEY;
  if (typeof jwt !== 'string' || Buffer.byteLength(jwt) < 32)
    throw new Error('JWT_SECRET requiere al menos 32 bytes.');
  if (typeof key !== 'string' || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error(
      'TOTP_ENCRYPTION_KEY requiere 64 caracteres hexadecimales.',
    );
  if (jwt === key)
    throw new Error('Las claves JWT y TOTP deben ser distintas.');
  return { JWT_SECRET: jwt, TOTP_ENCRYPTION_KEY: key };
}

export const JWT_ISSUER = 'inventory-api';
export const JWT_AUDIENCE = 'inventory-client';
export const ACCESS_SECONDS = 900;
export const CHALLENGE_SECONDS = 300;
export const ENROLLMENT_SECONDS = 900;
