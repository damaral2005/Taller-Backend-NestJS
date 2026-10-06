import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { DataSource, EntityManager } from 'typeorm';
import { RuntimeEnvironment } from '../config/runtime-environment';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ACCESS_SECONDS,
  CHALLENGE_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from './auth.config';
import {
  acceptedCounter,
  decryptSecret,
  encryptSecret,
  newToken,
  newTotpSecret,
  tokenDigest,
  totp,
  verifyPassword,
} from './crypto';
import { AuthProof, ProofKind } from './entities/auth-proof.entity';
import { Session } from './entities/session.entity';

export interface Identity {
  id: string;
  username: string;
  role: UserRole;
  sessionId: string;
}
interface AccessClaims {
  sub: string;
  sid: string;
  typ: string;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly source: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<RuntimeEnvironment, true>,
  ) {}

  private key(): string {
    return this.config.get('TOTP_ENCRYPTION_KEY', { infer: true });
  }
  private rejected(): UnauthorizedException {
    return new UnauthorizedException('Credenciales inválidas.');
  }

  private lockUser(
    manager: EntityManager,
    where: { id: string } | { username: string },
  ): Promise<User | null> {
    return manager
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.totpSecret',
        'user.lastTotpCounter',
        'user.loginFailures',
        'user.blockedUntil',
        'user.totpFailures',
        'user.totpBlockedUntil',
      ])
      .where(where)
      .setLock('pessimistic_write')
      .getOne();
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ challengeToken: string; expiresIn: number }> {
    const result = await this.source.transaction(async (manager) => {
      const user = await this.lockUser(manager, { username });
      const validPassword = await verifyPassword(password, user?.passwordHash);
      if (!user) return null;
      const now = Date.now();
      if (user.totpBlockedUntil && user.totpBlockedUntil.getTime() > now)
        return null;
      if (user.blockedUntil && user.blockedUntil.getTime() > now) return null;
      if (user.blockedUntil) {
        user.loginFailures = 0;
        user.blockedUntil = null;
      }
      if (!validPassword) {
        user.loginFailures++;
        if (user.loginFailures >= 5)
          user.blockedUntil = new Date(now + 900_000);
        await manager.save(user);
        return null;
      }
      user.loginFailures = 0;
      user.blockedUntil = null;
      await manager.save(user);
      if (!user.totpSecret) return null;
      const token = newToken();
      await manager.save(AuthProof, {
        userId: user.id,
        kind: 'challenge',
        tokenHash: tokenDigest(token),
        expiresAt: new Date(now + CHALLENGE_SECONDS * 1000),
      });
      return { challengeToken: token, expiresIn: CHALLENGE_SECONDS };
    });
    if (!result) throw this.rejected();
    return result;
  }

  private async withProof<T>(
    token: string,
    kind: ProofKind,
    operation: (
      manager: EntityManager,
      proof: AuthProof,
      user: User,
    ) => Promise<T | null>,
  ): Promise<T> {
    const result = await this.source.transaction(async (manager) => {
      const repository = manager.getRepository(AuthProof);
      const found = await repository.findOneBy({
        tokenHash: tokenDigest(token),
        kind,
      });
      if (!found) return null;
      const user = await this.lockUser(manager, { id: found.userId });
      const proof = await repository
        .createQueryBuilder('proof')
        .addSelect('proof.pendingSecret')
        .where('proof.id = :id', { id: found.id })
        .setLock('pessimistic_write')
        .getOne();
      if (
        !user ||
        !proof ||
        proof.consumedAt ||
        proof.attempts >= 5 ||
        proof.expiresAt.getTime() <= Date.now()
      )
        return null;
      if (user.totpBlockedUntil && user.totpBlockedUntil.getTime() > Date.now())
        return null;
      if (user.totpBlockedUntil) {
        user.totpFailures = 0;
        user.totpBlockedUntil = null;
        await manager.save(user);
      }
      return operation(manager, proof, user);
    });
    if (result === null) throw this.rejected();
    return result;
  }

  setup(token: string): Promise<{ secret: string; uri: string }> {
    return this.withProof(token, 'enrollment', async (manager, proof, user) => {
      if (user.totpSecret) return null;
      let secret: string;
      if (proof.pendingSecret)
        secret = decryptSecret(
          proof.pendingSecret,
          this.key(),
          `enrollment:${user.id}`,
        );
      else {
        secret = newTotpSecret();
        proof.pendingSecret = encryptSecret(
          secret,
          this.key(),
          `enrollment:${user.id}`,
        );
        await manager.save(proof);
      }
      return { secret, uri: totp(secret, user.username).toString() };
    });
  }

  private async failedProof(
    manager: EntityManager,
    proof: AuthProof,
    user: User,
  ): Promise<null> {
    proof.attempts++;
    user.totpFailures++;
    if (user.totpFailures >= 5)
      user.totpBlockedUntil = new Date(Date.now() + 900_000);
    if (proof.attempts >= 5) {
      proof.consumedAt = new Date();
      proof.pendingSecret = null;
    }
    await manager.save(proof);
    await manager.save(user);
    return null;
  }

  confirm(token: string, code: string): Promise<{ enabled: true }> {
    return this.withProof(token, 'enrollment', async (manager, proof, user) => {
      if (user.totpSecret || !proof.pendingSecret)
        return this.failedProof(manager, proof, user);
      const secret = decryptSecret(
        proof.pendingSecret,
        this.key(),
        `enrollment:${user.id}`,
      );
      const counter = acceptedCounter(secret, code, user.lastTotpCounter);
      if (counter === null) return this.failedProof(manager, proof, user);
      user.totpSecret = encryptSecret(secret, this.key(), `totp:${user.id}`);
      user.totpFailures = 0;
      user.lastTotpCounter = counter;
      proof.consumedAt = new Date();
      proof.pendingSecret = null;
      await manager.save(user);
      await manager.save(proof);
      return { enabled: true };
    });
  }

  verify(
    token: string,
    code: string,
  ): Promise<{ accessToken: string; tokenType: 'Bearer'; expiresIn: number }> {
    return this.withProof(token, 'challenge', async (manager, proof, user) => {
      if (!user.totpSecret) return this.failedProof(manager, proof, user);
      const secret = decryptSecret(
        user.totpSecret,
        this.key(),
        `totp:${user.id}`,
      );
      const counter = acceptedCounter(secret, code, user.lastTotpCounter);
      if (counter === null) return this.failedProof(manager, proof, user);
      user.totpFailures = 0;
      user.lastTotpCounter = counter;
      proof.consumedAt = new Date();
      await manager.save(user);
      await manager.save(proof);
      const session = await manager.save(Session, {
        userId: user.id,
        expiresAt: new Date(Date.now() + ACCESS_SECONDS * 1000),
      });
      const accessToken = await this.jwt.signAsync({
        sub: user.id,
        sid: session.id,
        typ: 'access',
      });
      return { accessToken, tokenType: 'Bearer', expiresIn: ACCESS_SECONDS };
    });
  }

  async authenticate(token: string): Promise<Identity> {
    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (
        claims.typ !== 'access' ||
        !isUUID(claims.sub, '4') ||
        !isUUID(claims.sid, '4') ||
        !Number.isSafeInteger(claims.exp)
      )
        throw this.rejected();
    } catch {
      throw this.rejected();
    }
    const session = await this.source.getRepository(Session).findOne({
      where: { id: claims.sid, userId: claims.sub },
      relations: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    )
      throw this.rejected();
    return {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      sessionId: session.id,
    };
  }

  async logout(identity: Identity): Promise<void> {
    await this.source
      .getRepository(Session)
      .update(
        { id: identity.sessionId, userId: identity.id },
        { revokedAt: new Date() },
      );
  }
}
