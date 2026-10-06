import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ProofKind = 'enrollment' | 'challenge';

@Entity('auth_proofs')
@Check('proofs_kind_valid', `"kind" IN ('enrollment', 'challenge')`)
@Check('proofs_attempts_valid', `"attempts" BETWEEN 0 AND 5`)
export class AuthProof {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
  @Column({ type: 'varchar', length: 16 }) kind!: ProofKind;
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash!: string;
  @Column({
    name: 'pending_secret',
    type: 'text',
    nullable: true,
    select: false,
  })
  pendingSecret!: string | null;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;
  @Column({ type: 'integer', default: 0 }) attempts!: number;
}
