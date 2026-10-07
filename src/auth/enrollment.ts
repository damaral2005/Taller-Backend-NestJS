import { DataSource, EntityManager } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuthProof } from './entities/auth-proof.entity';
import { ENROLLMENT_SECONDS } from './auth.config';
import { newToken, tokenDigest } from './crypto';

export async function issueEnrollment(
  source: DataSource,
  username: string,
): Promise<{ enrollmentToken: string; expiresIn: number }> {
  return source.transaction((manager) =>
    issueEnrollmentInTransaction(manager, username),
  );
}

export async function issueEnrollmentInTransaction(
  manager: EntityManager,
  username: string,
): Promise<{ enrollmentToken: string; expiresIn: number }> {
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username))
    throw new Error('Username inválido.');
  const user = await manager
    .getRepository(User)
    .createQueryBuilder('user')
    .addSelect('user.totpSecret')
    .where('user.username = :username', { username })
    .setLock('pessimistic_write')
    .getOne();
  if (!user || user.totpSecret)
    throw new Error('El usuario no admite enrolamiento inicial.');
  const proofs = manager.getRepository(AuthProof);
  await proofs.update(
    { userId: user.id, kind: 'enrollment' },
    { consumedAt: new Date(), pendingSecret: null },
  );
  const token = newToken();
  await proofs.save(
    proofs.create({
      userId: user.id,
      kind: 'enrollment',
      tokenHash: tokenDigest(token),
      expiresAt: new Date(Date.now() + ENROLLMENT_SECONDS * 1000),
    }),
  );
  return { enrollmentToken: token, expiresIn: ENROLLMENT_SECONDS };
}
