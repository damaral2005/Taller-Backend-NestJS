import { IsIn, IsString, Length, Matches } from 'class-validator';
import { UserRole } from './entities/user.entity';
import { PaginationQueryDto } from '../common/pagination';

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

export class ListUsersDto extends PaginationQueryDto {}
