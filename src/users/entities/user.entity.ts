import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'operador';

@Entity('users')
@Check('users_username_format', `"username" ~ '^[a-z0-9][a-z0-9._-]{2,63}$'`)
@Check('users_role_valid', `"role" IN ('admin', 'operador')`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  username!: string;

  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 16, default: 'operador' })
  role!: UserRole;

  @Column({ name: 'totp_secret', type: 'text', nullable: true, select: false })
  totpSecret!: string | null;

  @Column({
    name: 'last_totp_counter',
    type: 'integer',
    nullable: true,
    select: false,
  })
  lastTotpCounter!: number | null;

  @Column({
    name: 'login_failures',
    type: 'integer',
    default: 0,
    select: false,
  })
  loginFailures!: number;

  @Column({
    name: 'blocked_until',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  blockedUntil!: Date | null;

  @Column({ name: 'totp_failures', type: 'integer', default: 0, select: false })
  totpFailures!: number;

  @Column({
    name: 'totp_blocked_until',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  totpBlockedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
