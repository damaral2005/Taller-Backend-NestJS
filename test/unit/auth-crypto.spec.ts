import { randomUUID } from 'node:crypto';
import { validateAuthEnvironment } from '../../src/auth/auth.config';
import {
  acceptedCounter,
  decryptSecret,
  encryptSecret,
  newToken,
  newTotpSecret,
  tokenDigest,
  totp,
  verifyPassword,
} from '../../src/auth/crypto';
import { hashPassword } from '../../src/seed/password';

describe('Configuración y criptografía de autenticación', () => {
  const key = 'a1'.repeat(32);
  const base = {
    JWT_SECRET: 'test-only-secret-for-jwt-more-than-32-bytes',
    TOTP_ENCRYPTION_KEY: key,
  };
  it('acepta claves distintas y rechaza configuración débil sin revelar valores', () => {
    expect(validateAuthEnvironment(base)).toEqual(base);
    for (const JWT_SECRET of [undefined, 3, 'short'])
      expect(() => validateAuthEnvironment({ ...base, JWT_SECRET })).toThrow(
        'JWT_SECRET',
      );
    for (const TOTP_ENCRYPTION_KEY of [
      undefined,
      3,
      'g'.repeat(64),
      'a'.repeat(62),
    ])
      expect(() =>
        validateAuthEnvironment({ ...base, TOTP_ENCRYPTION_KEY }),
      ).toThrow('TOTP_ENCRYPTION_KEY');
    expect(() =>
      validateAuthEnvironment({ JWT_SECRET: key, TOTP_ENCRYPTION_KEY: key }),
    ).toThrow('distintas');
  });
  it('verifica hashes reales de seed, rechaza contraseña errónea, formato o parámetros no permitidos', async () => {
    const hash = await hashPassword('Test-only-long-password');
    expect(await verifyPassword('Test-only-long-password', hash)).toBe(true);
    expect(await verifyPassword('Another-long-password', hash)).toBe(false);
    expect(await verifyPassword('Another-long-password')).toBe(false);
    expect(
      await verifyPassword(
        'Test-only-long-password',
        hash.replace('32768', '999999999'),
      ),
    ).toBe(false);
  });
  it('cifra con IV distinta y detecta modificación, otra clave o contexto', () => {
    const context = `totp:${randomUUID()}`;
    const first = encryptSecret('secret-only-fixture', key, context);
    const second = encryptSecret('secret-only-fixture', key, context);
    expect(first).not.toEqual(second);
    expect(first).not.toContain('secret-only-fixture');
    expect(decryptSecret(first, key, context)).toBe('secret-only-fixture');
    expect(() => decryptSecret(first, key, 'another-context')).toThrow();
    expect(() => decryptSecret(first, 'b2'.repeat(32), context)).toThrow();
    expect(() => decryptSecret('not-encrypted', key, context)).toThrow(
      'inválido',
    );
    expect(() => decryptSecret('zz.aa.bb', key, context)).toThrow('inválido');
    const parts = first.split('.');
    parts[1] = '0'.repeat(32);
    expect(() => decryptSecret(parts.join('.'), key, context)).toThrow();
  });
  it('genera tokens aleatorios que solo se indexan por digest', () => {
    const first = newToken();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(newToken()).not.toBe(first);
    expect(tokenDigest(first)).toHaveLength(64);
    expect(tokenDigest(first)).not.toBe(first);
  });
  it('TOTP admite ±1 paso y rechaza replay, código erróneo y fuera de ventana', () => {
    const secret = newTotpSecret();
    expect(newTotpSecret()).not.toBe(secret);
    const timestamp = 1_791_244_800_000;
    const counter = Math.floor(timestamp / 30_000);
    for (const offset of [-1, 0, 1]) {
      const code = totp(secret, 'fixture').generate({
        timestamp: timestamp + offset * 30_000,
      });
      expect(acceptedCounter(secret, code, null, timestamp)).toBe(
        counter + offset,
      );
      expect(
        acceptedCounter(secret, code, counter + offset, timestamp),
      ).toBeNull();
      expect(
        acceptedCounter(secret, code, counter + offset - 1, timestamp),
      ).toBe(counter + offset);
    }
    expect(acceptedCounter(secret, 'bad', null, timestamp)).toBeNull();
    const old = totp(secret, '').generate({ timestamp: timestamp - 60_000 });
    expect(acceptedCounter(secret, old, null, timestamp)).toBeNull();
    expect(totp(secret, 'fixture').toString()).toContain('otpauth://totp/');
  });
});
