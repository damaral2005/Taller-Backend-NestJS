import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { Secret, TOTP } from 'otpauth';

export function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(): string {
  return randomBytes(32).toString('hex');
}

export function encryptSecret(
  secret: string,
  key: string,
  context: string,
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((value) => value.toString('hex'))
    .join('.');
}

export function decryptSecret(
  value: string,
  key: string,
  context: string,
): string {
  const parts = value.split('.');
  if (
    parts.length !== 3 ||
    !parts.every((part) => /^(?:[a-f0-9]{2})+$/.test(part))
  )
    throw new Error('Secreto cifrado inválido.');
  const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, 'hex'));
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

export function totp(secret: string, username: string): TOTP {
  return new TOTP({
    issuer: 'Inventario',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function acceptedCounter(
  secret: string,
  code: string,
  last: number | null,
  timestamp = Date.now(),
): number | null {
  const delta = totp(secret, '').validate({
    token: code,
    window: 1,
    timestamp,
  });
  if (delta === null) return null;
  const counter = Math.floor(timestamp / 30_000) + delta;
  return last !== null && counter <= last ? null : counter;
}

const dummyHash = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export async function verifyPassword(
  password: string,
  stored = dummyHash,
): Promise<boolean> {
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(
    stored,
  );
  if (!match) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      match[1],
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });
  return timingSafeEqual(derived, Buffer.from(match[2], 'hex'));
}
