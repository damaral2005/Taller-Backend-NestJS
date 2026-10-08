import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

// Idéntico al CHECK products_sku_format de la migración inicial.
export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,47}$/;
// PostgreSQL no admite el carácter NUL en texto: se rechaza con 400, no con 500.
// eslint-disable-next-line no-control-regex -- el NUL es justamente lo que se rechaza
const NO_NUL = /^[^\u0000]*$/;
const HAS_VISIBLE_CHARACTER = /\S/;

export class CreateProductDto {
  @IsString()
  @Matches(SKU_PATTERN)
  sku!: string;

  @IsString()
  @Length(1, 120)
  @Matches(HAS_VISIBLE_CHARACTER)
  @Matches(NO_NUL)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(NO_NUL)
  description?: string | null;
}

export class UpdateProductDto {
  // `name` no admite null: solo se omite cuando es undefined.
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 120)
  @Matches(HAS_VISIBLE_CHARACTER)
  @Matches(NO_NUL)
  name?: string;

  // `description: null` borra la descripción.
  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Matches(NO_NUL)
  description?: string | null;
}

export class SetProductStatusDto {
  @IsBoolean()
  active!: boolean;
}

export class ListProductsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Matches(NO_NUL)
  search?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';
}
