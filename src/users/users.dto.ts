import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from './entities/user.entity';

export class CreateUserDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9._-]{2,63}$/)
  username!: string;

  @IsString()
  @Length(12, 128)
  password!: string;

  @IsIn(['admin', 'operador'])
  role!: UserRole;
}

export class ChangeRoleDto {
  @IsIn(['admin', 'operador'])
  role!: UserRole;
}

export class ListUsersDto {
  @IsOptional()
  @IsString()
  @Matches(/^(?:[1-9]\d{0,3}|10000)$/)
  page?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:[1-9]|[1-9]\d|100)$/)
  limit?: string;
}
