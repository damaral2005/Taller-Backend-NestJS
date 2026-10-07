import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, QueryRunner } from 'typeorm';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/configure-app';
import {
  encryptSecret,
  newTotpSecret,
  tokenDigest,
  totp,
  verifyPassword,
} from '../../src/auth/crypto';
import { AuthProof } from '../../src/auth/entities/auth-proof.entity';
import { Session } from '../../src/auth/entities/session.entity';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';
import { hashPassword } from '../../src/seed/password';
import {
  createTestDatabase,
  disposeTestDatabase,
  TestDatabase,
} from '../helpers/database';

interface SafeUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
interface CreatedUser {
  user: SafeUser;
  enrollmentToken: string;
  expiresIn: number;
}
interface UserPage {
  data: SafeUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

describe('Administración y roles: HTTP con PostgreSQL real', () => {
  let context: TestDatabase;
  let app: INestApplication;
  let server: Server;
  let admin: User;
  let operator: User;
  let adminToken: string;
  let operatorToken: string;
  let hash: string;
  const password = 'Integration-only-password';
  const key = process.env.TOTP_ENCRYPTION_KEY!;

  beforeAll(async () => {
    hash = await hashPassword(password);
  });
  beforeEach(async () => {
    context = await createTestDatabase();
    await context.source.runMigrations();
    admin = await fixture('admin', 'admin');
    operator = await fixture('operador', 'operador');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(context.source)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    server = app.getHttpServer() as Server;
    adminToken = await access(admin);
    operatorToken = await access(operator);
  });
  afterEach(async () => {
    if (app) await app.close();
    if (context) await disposeTestDatabase(context);
  });

  async function fixture(
    username: string,
    role: UserRole,
    enrolled = true,
  ): Promise<User> {
    const user = await context.source
      .getRepository(User)
      .save({ username, role, passwordHash: hash });
    if (enrolled)
      await context.source.getRepository(User).update(user.id, {
        totpSecret: encryptSecret(newTotpSecret(), key, `totp:${user.id}`),
      });
    return context.source.getRepository(User).findOneByOrFail({ id: user.id });
  }
  async function access(user: User): Promise<string> {
    const session = await context.source
      .getRepository(Session)
      .save({ userId: user.id, expiresAt: new Date(Date.now() + 900_000) });
    return app
      .get(JwtService)
      .signAsync({ sub: user.id, sid: session.id, typ: 'access' });
  }
  function create(body: object, token = adminToken) {
    return request(server)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }
  function list(query = '', token = adminToken) {
    return request(server)
      .get(`/api/v1/users${query}`)
      .set('Authorization', `Bearer ${token}`);
  }
  function change(id: string, role: unknown, token = adminToken) {
    return request(server)
      .patch(`/api/v1/users/${id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role });
  }
  function assertSafe(user: SafeUser) {
    expect(Object.keys(user).sort()).toEqual([
      'createdAt',
      'id',
      'role',
      'updatedAt',
      'username',
    ]);
    expect(user.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
    expect(new Date(user.updatedAt).toISOString()).toBe(user.updatedAt);
  }

  it('las tres rutas rechazan acceso sin JWT o con credencial limitada y operador recibe 403', async () => {
    const payload = { username: 'new_user', password, role: 'operador' };
    const calls = [
      request(server).get('/api/v1/users'),
      request(server).post('/api/v1/users').send(payload),
      request(server)
        .patch(`/api/v1/users/${operator.id}/role`)
        .send({ role: 'admin' }),
    ];
    for (const call of calls)
      await call.expect(401).expect('Cache-Control', 'no-store');
    await list('', operatorToken).expect(403);
    await create(payload, operatorToken).expect(403);
    await change(operator.id, 'admin', operatorToken).expect(403);
    await list('', 'a'.repeat(64)).expect(401);
    expect(await context.source.getRepository(User).count()).toBe(2);
    expect(await context.source.getRepository(AuthProof).count()).toBe(0);
  });

  it.each(['admin', 'operador'] as const)(
    'admin crea rol %s sin filtrar hash/factor ni permitir login antes de enrolar',
    async (role) => {
      const response = await create({ username: 'new_user', password, role })
        .expect(201)
        .expect('Cache-Control', 'no-store');
      const body = response.body as CreatedUser;
      expect(Object.keys(body).sort()).toEqual([
        'enrollmentToken',
        'expiresIn',
        'user',
      ]);
      expect(body.expiresIn).toBe(900);
      assertSafe(body.user);
      expect(body.user.role).toBe(role);
      const user = await context.source
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect(['user.passwordHash', 'user.totpSecret'])
        .where('user.id = :id', { id: body.user.id })
        .getOneOrFail();
      expect(await verifyPassword(password, user.passwordHash)).toBe(true);
      expect(user.passwordHash).not.toBe(password);
      expect(user.totpSecret).toBeNull();
      const proof = await context.source
        .getRepository(AuthProof)
        .findOneByOrFail({ userId: user.id });
      expect(proof.tokenHash).toBe(tokenDigest(body.enrollmentToken));
      expect(proof.tokenHash).not.toBe(body.enrollmentToken);
      expect(proof.kind).toBe('enrollment');
      expect(JSON.stringify(body.user)).not.toContain(user.passwordHash);
      await request(server)
        .post('/api/v1/auth/login')
        .send({ username: 'new_user', password })
        .expect(401);
      await list('', body.enrollmentToken).expect(401);
    },
  );

  it('el usuario creado enrola TOTP, inicia sesión y recibe permisos de su rol', async () => {
    const response = await create({
      username: 'new_user',
      password,
      role: 'operador',
    }).expect(201);
    const created = response.body as CreatedUser;
    const setup = await request(server)
      .post('/api/v1/auth/2fa/setup')
      .send({ enrollmentToken: created.enrollmentToken })
      .expect(201);
    const { secret } = setup.body as { secret: string };
    const generator = totp(secret, 'new_user');
    await request(server)
      .post('/api/v1/auth/2fa/confirm')
      .send({
        enrollmentToken: created.enrollmentToken,
        code: generator.generate({ timestamp: Date.now() - 30_000 }),
      })
      .expect(200);
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ username: 'new_user', password })
      .expect(200);
    const { challengeToken } = login.body as { challengeToken: string };
    const verified = await request(server)
      .post('/api/v1/auth/verify-2fa')
      .send({ challengeToken, code: generator.generate() })
      .expect(200);
    const { accessToken } = verified.body as { accessToken: string };
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ id: created.user.id, username: 'new_user', role: 'operador' });
    await list('', accessToken).expect(403);
    await change(created.user.id, 'admin', accessToken).expect(403);
  });

  it('lista con defaults, orden estable, límites, páginas vacías y sin secretos', async () => {
    await fixture('zulu_user', 'admin', false);
    await fixture('alpha_user', 'operador');
    const first = await list().expect(200).expect('Cache-Control', 'no-store');
    const body = first.body as UserPage;
    expect(body).toMatchObject({ page: 1, limit: 20, total: 4, totalPages: 1 });
    expect(body.data.map((u) => u.username)).toEqual([
      'admin',
      'alpha_user',
      'operador',
      'zulu_user',
    ]);
    body.data.forEach(assertSafe);
    const page = await list('?page=2&limit=2').expect(200);
    expect((page.body as UserPage).data.map((u) => u.username)).toEqual([
      'operador',
      'zulu_user',
    ]);
    expect(page.body).toMatchObject({
      page: 2,
      limit: 2,
      total: 4,
      totalPages: 2,
    });
    await list('?page=10000&limit=100')
      .expect(200)
      .expect({ data: [], page: 10000, limit: 100, total: 4, totalPages: 1 });
  });

  it.each([
    '?page=0',
    '?page=01',
    '?page=-1',
    '?page=10001',
    '?page=1.5',
    '?page=1e2',
    '?page=1&page=2',
    '?limit=0',
    '?limit=101',
    '?limit=01',
    '?limit=',
    '?limit=%201',
    '?role=admin',
  ])('rechaza query %s', async (query) => {
    await list(query).expect(400).expect('Cache-Control', 'no-store');
  });

  it.each([
    { username: 'BAD' },
    { username: 'ab' },
    { username: 'a'.repeat(65) },
    { password: 'short' },
    { password: 'x'.repeat(129) },
    { role: 'superadmin' },
    { role: null },
    { role: undefined },
    { totpSecret: 'injected' },
    { passwordHash: 'injected' },
  ])('rechaza body de creación inválido %j', async (changes) => {
    await create({
      username: 'new_user',
      password,
      role: 'operador',
      ...changes,
    })
      .expect(400)
      .expect('Cache-Control', 'no-store');
    expect(await context.source.getRepository(User).count()).toBe(2);
    expect(await context.source.getRepository(AuthProof).count()).toBe(0);
  });

  it('conserva el usuario original ante duplicados y devuelve 409 sin detalles SQL', async () => {
    const first = await create({
      username: 'new_user',
      password,
      role: 'operador',
    }).expect(201);
    const duplicate = await create({
      username: 'new_user',
      password: 'Other-long-password',
      role: 'admin',
    }).expect(409);
    expect(JSON.stringify(duplicate.body)).not.toMatch(
      /INSERT|password_hash|scrypt|Other-long|23505/,
    );
    expect(
      (
        await context.source
          .getRepository(User)
          .findOneByOrFail({ id: (first.body as CreatedUser).user.id })
      ).role,
    ).toBe('operador');
    expect(await context.source.getRepository(AuthProof).count()).toBe(1);
  });

  it('dos creaciones simultáneas del mismo username generan un usuario y una credencial', async () => {
    const body = { username: 'new_user', password, role: 'operador' };
    const results = await Promise.all([create(body), create(body)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await context.source
        .getRepository(User)
        .countBy({ username: 'new_user' }),
    ).toBe(1);
    expect(await context.source.getRepository(AuthProof).count()).toBe(1);
  });

  it('un fallo al crear enrolamiento revierte también el usuario y no revela SQL/hash', async () => {
    await context.source.query(
      `CREATE FUNCTION "${context.ownedSchema}".reject_enrollment() RETURNS trigger LANGUAGE plpgsql AS $fn$ BEGIN RAISE EXCEPTION 'fixture enrollment failure'; END; $fn$`,
    );
    await context.source.query(
      `CREATE TRIGGER reject_enrollment BEFORE INSERT ON "${context.ownedSchema}".auth_proofs FOR EACH ROW EXECUTE FUNCTION "${context.ownedSchema}".reject_enrollment()`,
    );
    const response = await create({
      username: 'rollback_user',
      password,
      role: 'operador',
    }).expect(500);
    expect(JSON.stringify(response.body)).not.toMatch(
      /fixture|INSERT|password_hash|scrypt|Integration-only/,
    );
    expect(
      await context.source
        .getRepository(User)
        .countBy({ username: 'rollback_user' }),
    ).toBe(0);
    expect(await context.source.getRepository(AuthProof).count()).toBe(0);
  });

  it('promoción y degradación cambian permisos con el mismo JWT, sin cambiar hash ni factor', async () => {
    const stored = await context.source
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.totpSecret'])
      .where('user.id = :id', { id: operator.id })
      .getOneOrFail();
    const promoted = await change(operator.id, 'admin').expect(200);
    assertSafe(promoted.body as SafeUser);
    await list('', operatorToken).expect(200);
    const adminUser = await create(
      { username: 'created_by_promoted', password, role: 'operador' },
      operatorToken,
    ).expect(201);
    expect((adminUser.body as CreatedUser).user.username).toBe(
      'created_by_promoted',
    );
    await change(operator.id, 'operador').expect(200);
    await list('', operatorToken).expect(403);
    await change(operator.id, 'admin', operatorToken).expect(403);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200)
      .expect({ id: operator.id, username: 'operador', role: 'operador' });
    const after = await context.source
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.totpSecret'])
      .where('user.id = :id', { id: operator.id })
      .getOneOrFail();
    expect(after.passwordHash).toBe(stored.passwordHash);
    expect(after.totpSecret).toBe(stored.totpSecret);
  });

  it('UUID/body inválidos, campos extra y usuario inexistente tienen respuestas exactas', async () => {
    await change('not-uuid', 'admin').expect(400);
    for (const role of ['ADMIN', 'superadmin', null, 42])
      await change(operator.id, role).expect(400);
    await request(server)
      .patch(`/api/v1/users/${operator.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin', username: 'renamed' })
      .expect(400);
    await request(server)
      .patch(`/api/v1/users/${operator.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);
    await change(randomUUID(), 'admin').expect(404);
    expect(
      (
        await context.source
          .getRepository(User)
          .findOneByOrFail({ id: operator.id })
      ).role,
    ).toBe('operador');
  });

  it('rol idéntico es idempotente incluso para el último admin y mantiene timestamps', async () => {
    const same = await change(admin.id, 'admin').expect(200);
    expect((same.body as SafeUser).updatedAt).toBe(
      admin.updatedAt.toISOString(),
    );
    const operatorSame = await change(operator.id, 'operador').expect(200);
    expect((operatorSame.body as SafeUser).updatedAt).toBe(
      operator.updatedAt.toISOString(),
    );
  });

  it('protege al último admin y al último admin enrolado aunque haya otro pendiente', async () => {
    await change(admin.id, 'operador').expect(409);
    const other = await create({
      username: 'pending_admin',
      password,
      role: 'admin',
    }).expect(201);
    const id = (other.body as CreatedUser).user.id;
    const blocked = await change(admin.id, 'operador').expect(409);
    expect((blocked.body as { message: string }).message).toContain('2FA');
    await change(id, 'operador').expect(200);
    expect(
      (
        await context.source
          .getRepository(User)
          .findOneByOrFail({ id: admin.id })
      ).role,
    ).toBe('admin');
  });

  it('permite degradación propia si existe otro admin enrolado y el JWT pierde administración', async () => {
    await fixture('other_admin', 'admin');
    await change(admin.id, 'operador').expect(200);
    await list().expect(403);
    await create({ username: 'blocked_user', password, role: 'admin' }).expect(
      403,
    );
  });

  it('dos admins que se degradan simultáneamente nunca eliminan al último admin enrolado', async () => {
    const other = await fixture('other_admin', 'admin');
    const otherToken = await access(other);
    const results = await Promise.all([
      change(admin.id, 'operador'),
      change(other.id, 'operador', otherToken),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      await context.source.getRepository(User).countBy({ role: 'admin' }),
    ).toBe(1);
  });

  async function waitForAdministrativeWait(expected = 1): Promise<void> {
    for (let index = 0; index < 200; index++) {
      const rows = await context.source.query<{ waiting: number }[]>(
        'SELECT count(*)::int AS waiting FROM pg_locks WHERE locktype = $1 AND classid = $2::oid AND objid = $3::oid AND NOT granted',
        ['advisory', 721005, 1],
      );
      if (rows[0].waiting >= expected) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error('La petición no llegó al bloqueo administrativo.');
  }
  async function holdAdministration(): Promise<QueryRunner> {
    const runner = context.source.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    await runner.query('SELECT pg_advisory_xact_lock($1,$2)', [721005, 1]);
    return runner;
  }

  it.each(['demoted', 'revoked', 'expired'])(
    'revalida creación si el actor está %s después del guard mientras espera',
    async (state) => {
      await fixture('other_admin', 'admin');
      const blocker = await holdAdministration();
      const pending = create({
        username: 'blocked_user',
        password,
        role: 'admin',
      }).then((response) => response);
      try {
        await waitForAdministrativeWait();
        if (state === 'demoted')
          await blocker.manager.update(User, admin.id, { role: 'operador' });
        else
          await blocker.manager.update(
            Session,
            { userId: admin.id },
            state === 'revoked'
              ? { revokedAt: new Date() }
              : { expiresAt: new Date(Date.now() - 1) },
          );
        await blocker.commitTransaction();
        const response = await pending;
        expect(response.status).toBe(state === 'demoted' ? 403 : 401);
        expect(
          await context.source
            .getRepository(User)
            .countBy({ username: 'blocked_user' }),
        ).toBe(0);
        expect(await context.source.getRepository(AuthProof).count()).toBe(0);
      } finally {
        if (blocker.isTransactionActive) await blocker.rollbackTransaction();
        await blocker.release();
        await pending;
      }
    },
  );

  it('el listado y el cambio de rol también revalidan al actor al salir de la espera', async () => {
    const other = await fixture('other_admin', 'admin');
    const blocker = await holdAdministration();
    const pendingList = list().then((response) => response);
    const pendingRole = change(operator.id, 'admin').then(
      (response) => response,
    );
    try {
      await waitForAdministrativeWait(2);
      await blocker.manager.update(User, admin.id, { role: 'operador' });
      await blocker.commitTransaction();
      expect((await pendingList).status).toBe(403);
      expect((await pendingRole).status).toBe(403);
      expect(
        (
          await context.source
            .getRepository(User)
            .findOneByOrFail({ id: operator.id })
        ).role,
      ).toBe('operador');
      expect(
        (
          await context.source
            .getRepository(User)
            .findOneByOrFail({ id: other.id })
        ).role,
      ).toBe('admin');
    } finally {
      if (blocker.isTransactionActive) await blocker.rollbackTransaction();
      await blocker.release();
      await Promise.all([pendingList, pendingRole]);
    }
  });

  it('el servicio no confía en un rol admin inyectado en la identidad del operador', async () => {
    const session = await context.source
      .getRepository(Session)
      .findOneByOrFail({ userId: operator.id });
    await expect(
      app.get(UsersService).list(
        {
          id: operator.id,
          username: 'operador',
          role: 'admin',
          sessionId: session.id,
        },
        {},
      ),
    ).rejects.toThrow('Permisos insuficientes');
  });
});
