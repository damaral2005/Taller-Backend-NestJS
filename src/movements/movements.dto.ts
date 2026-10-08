import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../common/pagination';
import { MovementType } from './entities/stock-movement.entity';

export const MAX_STOCK = 2147483647;

export class CreateMovementDto {
  @IsUUID('4')
  productId!: string;

  @IsIn(['IN', 'OUT'])
  type!: MovementType;

  @IsInt()
  @Min(1)
  @Max(MAX_STOCK)
  quantity!: number;

  @IsString()
  @Length(1, 300)
  @Matches(/\S/)
  // eslint-disable-next-line no-control-regex -- PostgreSQL rechaza NUL en texto
  @Matches(/^[^\u0000]*$/)
  reason!: string;
}

export class ListMovementsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @IsOptional()
  @IsIn(['IN', 'OUT'])
  type?: MovementType;
}
