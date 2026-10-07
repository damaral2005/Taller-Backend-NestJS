import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  IsNull,
  MoreThan,
  Not,
  QueryFailedError,
} from 'typeorm';
import { Identity } from '../auth/auth.service';
import { Session } from '../auth/entities/session.entity';
import { issueEnrollmentInTransaction } from '../auth/enrollment';
import { hashPassword } from '../seed/password';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, ListUsersDto } from './users.dto';
import { UserView, userView } from './user.view';

@Injectable()
export class UsersService {
  constructor(private readonly source: DataSource) {}

  private adminTransaction<T>(
    actor: Identity,
    mode: 'read' | 'write',
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.source.transaction(async (manager) => {
      const lock =
        mode === 'read'
          ? 'pg_advisory_xact_lock_shared'
          : 'pg_advisory_xact_lock';
      await manager.query(`SELECT ${lock}($1, $2)`, [721005, 1]);
      const session = await manager.getRepository(Session).findOne({
        where: {
          id: actor.sessionId,
          userId: actor.id,
          revokedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
        relations: { user: true },
      });
      if (!session) throw new UnauthorizedException('Credenciales inválidas.');
      if (session.user.role !== 'admin')
        throw new ForbiddenException('Permisos insuficientes.');
      return operation(manager);
    });
  }

  async create(
    actor: Identity,
    input: CreateUserDto,
  ): Promise<{ user: UserView; enrollmentToken: string; expiresIn: number }> {
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.adminTransaction(actor, 'write', async (manager) => {
        const user = await manager
          .getRepository(User)
          .save({ username: input.username, role: input.role, passwordHash });
        const enrollment = await issueEnrollmentInTransaction(
          manager,
          user.username,
        );
        return { user: userView(user), ...enrollment };
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driver: unknown = error.driverError;
        if (
          typeof driver === 'object' &&
          driver !== null &&
          'code' in driver &&
          driver.code === '23505' &&
          'constraint' in driver &&
          driver.constraint === 'users_username_key'
        )
          throw new ConflictException('El username ya existe.');
        throw new InternalServerErrorException('No se pudo crear el usuario.');
      }
      throw error;
    }
  }

  list(
    actor: Identity,
    input: ListUsersDto,
  ): Promise<{
    data: UserView[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Number(input.page ?? '1');
    const limit = Number(input.limit ?? '20');
    return this.adminTransaction(actor, 'read', async (manager) => {
      const [users, total] = await manager.getRepository(User).findAndCount({
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        order: { username: 'ASC', id: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        data: users.map(userView),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  changeRole(actor: Identity, id: string, role: UserRole): Promise<UserView> {
    return this.adminTransaction(actor, 'write', async (manager) => {
      const repository = manager.getRepository(User);
      const user = await repository
        .createQueryBuilder('user')
        .addSelect('user.totpSecret')
        .where('user.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();
      if (!user) throw new NotFoundException('Usuario no encontrado.');
      if (user.role === role) return userView(user);
      if (user.role === 'admin') {
        if ((await repository.countBy({ role: 'admin' })) <= 1)
          throw new ConflictException(
            'No se puede degradar al último administrador.',
          );
        if (
          user.totpSecret &&
          (await repository.countBy({
            role: 'admin',
            totpSecret: Not(IsNull()),
          })) <= 1
        )
          throw new ConflictException(
            'No se puede degradar al último administrador con 2FA activo.',
          );
      }
      await repository.update({ id }, { role });
      return userView(await repository.findOneByOrFail({ id }));
    });
  }
}
