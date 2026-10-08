import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/configure-app';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AuthService } from '../../src/auth/auth.service';
import { AuthModule } from '../../src/auth/auth.module';
import { Roles, RolesGuard } from '../../src/auth/roles.guard';
import {
  encryptSecret,
  newTotpSecret,
  tokenDigest,
  totp,
} from '../../src/auth/crypto';
import { issueEnrollment } from '../../src/auth/enrollment';
import { enrollFromEnvironment } from '../../src/auth/enroll';
import { AuthProof } from '../../src/auth/entities/auth-proof.entity';
import { Session } from '../../src/auth/entities/session.entity';
import { User } from '../../src/users/entities/user.entity';
import { Product } from '../../src/products/entities/products.entity';
import { hashPassword } from '../../src/seed/password';
import {
  createTestDatabase,
  disposeTestDatabase,
  inTestEnvironment,
  TestDatabase,
} from '../helpers/database';

@Controller('test-roles')
class RoleProbe {
  @Get('admin') @Roles('admin') @UseGuards(AuthGuard, RolesGuard) admin() {
    return { allowed: true };
  }
  @Get('authenticated') @UseGuards(AuthGuard, RolesGuard) any() {
    return { allowed: true };
  }
  @Get('missing-identity') @Roles('admin') @UseGuards(RolesGuard) missing() {
    return { allowed: true };
  }
}

describe('Autenticación HTTP con PostgreSQL real', () => {
  let context: TestDatabase;
  let app: INestApplication;
  let server: Server;
  let user: User;
  let passwordHash: string;
  const password = 'Integration-only-password';
  const key = process.env.TOTP_ENCRYPTION_KEY!;

  beforeAll(async () => {
    passwordHash = await hashPassword(password);
  });
  beforeEach(async () => {
    context = await createTestDatabase();
    await context.source.runMigrations();
    user = await context.source
      .getRepository(User)
      .save({ username: 'admin', role: 'admin', passwordHash });
    const module = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [RoleProbe],
    })
      .overrideProvider(DataSource)
      .useValue(context.source)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });
  afterEach(async () => {
    if (app) await app.close();
    if (context) await disposeTestDatabase(context);
  });

  function post(path: string, body: object) {
    return request(server).post(`/api/v1/auth/${path}`).send(body);
  }
  function code(secret: string, offset = 0): string {
    return totp(secret, 'admin').generate({
      timestamp: Date.now() + offset * 30_000,
    });
  }
  async function enrolled(): Promise<string> {
    const secret = newTotpSecret();
    await context.source.getRepository(User).update(user.id, {
      totpSecret: encryptSecret(secret, key, `totp:${user.id}`),
    });
    return secret;
  }
  async function challenge(): Promise<string> {
    const response = await post('login', { username: 'admin', password })
      .expect(200)
      .expect('Cache-Control', 'no-store');
    const body = response.body as { challengeToken: string; expiresIn: number };
    expect(body.expiresIn).toBe(300);
    return body.challengeToken;
  }
  async function session(secret: string): Promise<string> {
    const response = await post('verify-2fa', {
      challengeToken: await challenge(),
      code: code(secret),
    }).expect(200);
    expect(response.body).toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    return (response.body as { accessToken: string }).accessToken;
  }
  async function proof(token: string): Promise<AuthProof> {
    return context.source
      .getRepository(AuthProof)
      .findOneByOrFail({ tokenHash: tokenDigest(token) });
  }

  it('recorre script → setup → confirmación → login → JWT → identidad → logout', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    let enrollmentToken: string;
    try {
      await inTestEnvironment(context, () => enrollFromEnvironment('admin'));
      enrollmentToken = (
        JSON.parse(log.mock.calls[0][0] as string) as {
          enrollmentToken: string;
        }
      ).enrollmentToken;
    } finally {
      log.mockRestore();
    }
    const setup = await post('2fa/setup', { enrollmentToken })
      .expect(201)
      .expect('Cache-Control', 'no-store');
    const body = setup.body as { secret: string; uri: string };
    expect(body.uri).toContain(`secret=${body.secret}`);
    await post('2fa/setup', { enrollmentToken }).expect(201).expect(body);
    await post('2fa/confirm', { enrollmentToken, code: code(body.secret, -1) })
      .expect(200)
      .expect({ enabled: true });
    await post('2fa/setup', { enrollmentToken }).expect(401);
    const access = await session(body.secret);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(200)
      .expect({ id: user.id, username: 'admin', role: 'admin' });
    const stored = await context.source
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.totpSecret')
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    expect(stored.totpSecret).not.toContain(body.secret);
    expect(await context.source.getRepository(Session).count()).toBe(1);
    await request(server)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${access}`)
      .expect(204)
      .expect('');
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(401);
    await request(server)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${access}`)
      .expect(401);
  });

  it('no permite login antes de TOTP y mantiene el mismo error para usuario inexistente/contraseña errónea', async () => {
    const a = await post('login', { username: 'admin', password }).expect(401);
    const b = await post('login', { username: 'missing', password }).expect(
      401,
    );
    const c = await post('login', {
      username: 'admin',
      password: 'Wrong-long-password',
    }).expect(401);
    expect(a.body).toEqual(b.body);
    expect(b.body).toEqual(c.body);
    expect(await context.source.getRepository(Session).count()).toBe(0);
  });

  it('reemisión privada invalida enrolamiento anterior y rechaza usuario ausente, inválido o ya enrolado', async () => {
    const first = await issueEnrollment(context.source, 'admin');
    await post('2fa/setup', first).expect(400); // expiresIn no es un campo de entrada.
    const second = await issueEnrollment(context.source, 'admin');
    await post('2fa/setup', { enrollmentToken: first.enrollmentToken }).expect(
      401,
    );
    await post('2fa/setup', { enrollmentToken: second.enrollmentToken }).expect(
      201,
    );
    await expect(issueEnrollment(context.source, 'bad name')).rejects.toThrow(
      'inválido',
    );
    await expect(issueEnrollment(context.source, 'missing')).rejects.toThrow(
      'no admite',
    );
    await expect(enrollFromEnvironment(undefined)).rejects.toThrow('username');
    await enrolled();
    await expect(issueEnrollment(context.source, 'admin')).rejects.toThrow(
      'no admite',
    );
  });

  it('credenciales limitadas, tokens aleatorios y headers inválidos nunca permiten /me', async () => {
    const enrollment = await issueEnrollment(context.source, 'admin');
    await enrolled();
    const challengeToken = await challenge();
    for (const value of [
      undefined,
      'Basic fake',
      'Bearer',
      `Bearer ${enrollment.enrollmentToken}`,
      `Bearer ${challengeToken}`,
      `Bearer ${'a'.repeat(64)}`,
    ]) {
      const call = request(server).get('/api/v1/auth/me');
      if (value) call.set('Authorization', value);
      await call.expect(401).expect('Cache-Control', 'no-store');
    }
    await request(server).get('/test-roles/admin').expect(404);
    expect(await context.source.getRepository(Session).count()).toBe(0);
  });

  it.each([
    ['login', { username: 'ADMIN', password }],
    ['login', { username: 'admin', password: 'short' }],
    ['login', { username: 'admin', password, role: 'admin' }],
    ['2fa/setup', { enrollmentToken: 42 }],
    ['2fa/confirm', { enrollmentToken: 'a'.repeat(64), code: '12345' }],
    ['verify-2fa', { challengeToken: 'b'.repeat(64), code: 123456 }],
    [
      'verify-2fa',
      { challengeToken: 'b'.repeat(64), code: '123456', extra: true },
    ],
  ])('rechaza DTO inválido en %s sin crear sesión', async (path, body) => {
    await post(path, body).expect(400).expect('Cache-Control', 'no-store');
    expect(await context.source.getRepository(Session).count()).toBe(0);
  });

  it('login bloquea la cuenta tras cinco fallos, persiste el bloqueo y reinicia tras vencer', async () => {
    await enrolled();
    for (let i = 0; i < 5; i++)
      await post('login', {
        username: 'admin',
        password: 'Wrong-long-password',
      }).expect(401);
    await post('login', { username: 'admin', password }).expect(401);
    const users = context.source.getRepository(User);
    const stored = await users
      .createQueryBuilder('user')
      .addSelect(['user.loginFailures', 'user.blockedUntil'])
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    expect(stored.loginFailures).toBe(5);
    expect(stored.blockedUntil!.getTime()).toBeGreaterThan(Date.now());
    await users.update(user.id, { blockedUntil: new Date(Date.now() - 1) });
    await challenge();
    const restored = await users
      .createQueryBuilder('user')
      .addSelect(['user.loginFailures', 'user.blockedUntil'])
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    expect(restored.loginFailures).toBe(0);
    expect(restored.blockedUntil).toBeNull();
  });

  it('confirmación antes de setup, código erróneo y quinto fallo se guardan sin activar TOTP', async () => {
    const { enrollmentToken } = await issueEnrollment(context.source, 'admin');
    await post('2fa/confirm', { enrollmentToken, code: '123456' }).expect(401);
    expect((await proof(enrollmentToken)).attempts).toBe(1);
    const setup = await post('2fa/setup', { enrollmentToken }).expect(201);
    const secret = (setup.body as { secret: string }).secret;
    const invalid = totp(secret, '').generate({
      timestamp: Date.now() - 600_000,
    });
    for (let i = 0; i < 4; i++)
      await post('2fa/confirm', { enrollmentToken, code: invalid }).expect(401);
    expect((await proof(enrollmentToken)).attempts).toBe(5);
    expect((await proof(enrollmentToken)).consumedAt).not.toBeNull();
    await post('2fa/confirm', { enrollmentToken, code: code(secret) }).expect(
      401,
    );
    await post('2fa/setup', { enrollmentToken }).expect(401);
  });

  it('rechaza setup/confirmación si el usuario ya tiene factor, incluso con credencial pendiente', async () => {
    const { enrollmentToken } = await issueEnrollment(context.source, 'admin');
    await post('2fa/setup', { enrollmentToken }).expect(201);
    const secret = await enrolled();
    await post('2fa/setup', { enrollmentToken }).expect(401);
    await post('2fa/confirm', { enrollmentToken, code: code(secret) }).expect(
      401,
    );
  });

  it('rechaza credenciales inexistentes, vencidas o con propósito distinto', async () => {
    await post('2fa/setup', { enrollmentToken: 'a'.repeat(64) }).expect(401);
    const { enrollmentToken } = await issueEnrollment(context.source, 'admin');
    await context.source
      .getRepository(AuthProof)
      .update(
        { tokenHash: tokenDigest(enrollmentToken) },
        { expiresAt: new Date(Date.now() - 1) },
      );
    await post('2fa/setup', { enrollmentToken }).expect(401);
    await post('2fa/confirm', { enrollmentToken, code: '123456' }).expect(401);
    const secret = await enrolled();
    const challengeToken = await challenge();
    await post('2fa/setup', { enrollmentToken: challengeToken }).expect(401);
    await post('verify-2fa', {
      challengeToken: enrollmentToken,
      code: code(secret),
    }).expect(401);
    await context.source
      .getRepository(AuthProof)
      .update(
        { tokenHash: tokenDigest(challengeToken) },
        { expiresAt: new Date(Date.now() - 1) },
      );
    await post('verify-2fa', { challengeToken, code: code(secret) }).expect(
      401,
    );
  });

  it('verificación 2FA guarda fallos y agota el desafío al quinto', async () => {
    const secret = await enrolled();
    const challengeToken = await challenge();
    const invalid = totp(secret, '').generate({
      timestamp: Date.now() - 600_000,
    });
    for (let i = 0; i < 5; i++)
      await post('verify-2fa', { challengeToken, code: invalid }).expect(401);
    expect((await proof(challengeToken)).attempts).toBe(5);
    await post('verify-2fa', { challengeToken, code: code(secret) }).expect(
      401,
    );
    expect(await context.source.getRepository(Session).count()).toBe(0);
  });

  it('el límite 2FA persiste por cuenta y no se evita solicitando desafíos nuevos', async () => {
    const secret = await enrolled();
    const first = await challenge();
    const second = await challenge();
    const invalid = totp(secret, '').generate({
      timestamp: Date.now() - 600_000,
    });
    for (let index = 0; index < 3; index++)
      await post('verify-2fa', { challengeToken: first, code: invalid }).expect(
        401,
      );
    for (let index = 0; index < 2; index++)
      await post('verify-2fa', {
        challengeToken: second,
        code: invalid,
      }).expect(401);
    await post('verify-2fa', {
      challengeToken: second,
      code: code(secret),
    }).expect(401);
    await post('login', { username: 'admin', password }).expect(401);
    const users = context.source.getRepository(User);
    const stored = await users
      .createQueryBuilder('user')
      .addSelect(['user.totpFailures', 'user.totpBlockedUntil'])
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    expect(stored.totpFailures).toBe(5);
    expect(stored.totpBlockedUntil!.getTime()).toBeGreaterThan(Date.now());
    await users.update(user.id, { totpBlockedUntil: new Date(Date.now() - 1) });
    await post('verify-2fa', {
      challengeToken: second,
      code: code(secret),
    }).expect(200);
    const restored = await users
      .createQueryBuilder('user')
      .addSelect(['user.totpFailures', 'user.totpBlockedUntil'])
      .where('user.id = :id', { id: user.id })
      .getOneOrFail();
    expect(restored.totpFailures).toBe(0);
    expect(restored.totpBlockedUntil).toBeNull();
  });

  it('no consume el desafío válido si un código falla y permite después un código correcto', async () => {
    const secret = await enrolled();
    const challengeToken = await challenge();
    await post('verify-2fa', {
      challengeToken,
      code: totp(secret, '').generate({ timestamp: Date.now() - 600_000 }),
    }).expect(401);
    await post('verify-2fa', { challengeToken, code: code(secret) }).expect(
      200,
    );
    await post('verify-2fa', { challengeToken, code: code(secret) }).expect(
      401,
    );
  });

  it('dos verificaciones simultáneas de un desafío crean una sola sesión', async () => {
    const secret = await enrolled();
    const challengeToken = await challenge();
    const current = code(secret);
    const results = await Promise.all([
      post('verify-2fa', { challengeToken, code: current }),
      post('verify-2fa', { challengeToken, code: current }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(await context.source.getRepository(Session).count()).toBe(1);
  });

  it('dos desafíos distintos no pueden reutilizar el mismo contador, ni tras reconectar', async () => {
    const secret = await enrolled();
    const first = await challenge();
    const second = await challenge();
    const current = code(secret);
    await post('verify-2fa', { challengeToken: first, code: current }).expect(
      200,
    );
    await context.source.destroy();
    await context.source.initialize();
    await post('verify-2fa', { challengeToken: second, code: current }).expect(
      401,
    );
    expect((await proof(second)).attempts).toBe(1);
    expect(await context.source.getRepository(Session).count()).toBe(1);
  });

  it('confirmación concurrente consume una sola vez la credencial y su código tampoco sirve para login', async () => {
    const { enrollmentToken } = await issueEnrollment(context.source, 'admin');
    const setup = await post('2fa/setup', { enrollmentToken }).expect(201);
    const secret = (setup.body as { secret: string }).secret;
    const current = code(secret);
    const results = await Promise.all([
      post('2fa/confirm', { enrollmentToken, code: current }),
      post('2fa/confirm', { enrollmentToken, code: current }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
    await post('verify-2fa', {
      challengeToken: await challenge(),
      code: current,
    }).expect(401);
  });

  it('rechaza desafío si el factor desaparece sin crear sesión', async () => {
    const secret = await enrolled();
    const challengeToken = await challenge();
    await context.source
      .getRepository(User)
      .update(user.id, { totpSecret: null });
    await post('verify-2fa', { challengeToken, code: code(secret) }).expect(
      401,
    );
    expect(await context.source.getRepository(Session).count()).toBe(0);
  });

  it('guarda sesión entre reinicios de conexión y consulta el rol vigente para autorización', async () => {
    const access = await session(await enrolled());
    await context.source.destroy();
    await context.source.initialize();
    await request(server)
      .get('/api/v1/test-roles/admin')
      .set('Authorization', `Bearer ${access}`)
      .expect(200);
    await context.source
      .getRepository(User)
      .update(user.id, { role: 'operador' });
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(200)
      .expect({ id: user.id, username: 'admin', role: 'operador' });
    await request(server)
      .get('/api/v1/test-roles/admin')
      .set('Authorization', `Bearer ${access}`)
      .expect(403);
    await request(server)
      .get('/api/v1/test-roles/authenticated')
      .set('Authorization', `Bearer ${access}`)
      .expect(200);
    await request(server)
      .get('/api/v1/test-roles/missing-identity')
      .expect(403);
  });

  it('rechaza sesiones ausentes/vencidas y logout conserva otras sesiones', async () => {
    const access = await session(await enrolled());
    const jwt = app.get(JwtService);
    const stored = await context.source
      .getRepository(Session)
      .findOneByOrFail({ userId: user.id });
    const other = await context.source
      .getRepository(Session)
      .save({ userId: user.id, expiresAt: new Date(Date.now() + 60_000) });
    const otherToken = await jwt.signAsync({
      sub: user.id,
      sid: other.id,
      typ: 'access',
    });
    await request(server)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${access}`)
      .expect(204);
    await context.source.destroy();
    await context.source.initialize();
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(401);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    await context.source
      .getRepository(Session)
      .update(other.id, { expiresAt: new Date(Date.now() - 1) });
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(401);
    await context.source.getRepository(Session).delete(stored.id);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(401);
  });

  it('valida firma, algoritmo, issuer, audience, expiración y claims antes de consultar sesión', async () => {
    const jwt = app.get(JwtService);
    const sid = randomUUID();
    const claims = { sub: user.id, sid, typ: 'access' };
    const tokens = await Promise.all([
      jwt.signAsync(claims, { secret: 'wrong-key' }),
      jwt.signAsync(claims, { algorithm: 'HS512' }),
      jwt.signAsync(claims, { issuer: 'another' }),
      jwt.signAsync(claims, { audience: 'another' }),
      jwt.signAsync(claims, { expiresIn: -1 }),
      jwt.signAsync({ ...claims, sub: 'not-uuid' }),
      jwt.signAsync({ ...claims, sid: 'not-uuid' }),
      jwt.signAsync({ ...claims, typ: 'enrollment' }),
      new JwtService({ secret: process.env.JWT_SECRET }).signAsync({
        ...claims,
        iss: 'inventory-api',
        aud: 'inventory-client',
      }),
    ]);
    for (const token of tokens)
      await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    await expect(
      app.get(AuthService).authenticate(await jwt.signAsync(claims)),
    ).rejects.toThrow('Credenciales');
  });

  it('limita intentos HTTP por IP/ruta sin requerir consulta de una cuenta válida', async () => {
    for (let i = 0; i < 20; i++)
      await post('2fa/setup', { enrollmentToken: 'a'.repeat(64) }).expect(401);
    await post('2fa/setup', { enrollmentToken: 'a'.repeat(64) })
      .expect(429)
      .expect('Cache-Control', 'no-store');
  });

  it('migración de autenticación conserva datos y su reversión solo quita autenticación', async () => {
    const product = await context.source
      .getRepository(Product)
      .save({ sku: 'KEEP', name: 'Conservar', stock: 3 });
    await context.source.undoLastMigration();
    const rows = await context.source.query<
      { username: string; password_hash: string }[]
    >(`SELECT username,password_hash FROM "${context.ownedSchema}".users`);
    expect(rows).toEqual([{ username: 'admin', password_hash: passwordHash }]);
    expect(
      (
        await context.source
          .getRepository(Product)
          .findOneByOrFail({ id: product.id })
      ).stock,
    ).toBe(3);
    await context.source.runMigrations();
    expect(
      await context.source.getRepository(User).findOneByOrFail({ id: user.id }),
    ).toMatchObject({ username: 'admin', role: 'admin' });
    for (const loginFailures of [-1, 6])
      await expect(
        context.source.getRepository(User).update(user.id, { loginFailures }),
      ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      context.source
        .getRepository(User)
        .update(user.id, { lastTotpCounter: -1 }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      context.source.getRepository(AuthProof).insert({
        userId: user.id,
        kind: 'challenge',
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(),
        attempts: 6,
      }),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
  });
});
