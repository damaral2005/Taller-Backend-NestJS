import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * Parámetros de paginación compartidos. Ambos llegan como texto decimal sin
 * signos, espacios, fracciones ni ceros iniciales: page 1–10000 y limit 1–100.
 */
export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^(?:[1-9]\d{0,3}|10000)$/)
  page?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:[1-9]|[1-9]\d|100)$/)
  limit?: string;
}

export interface PageParams {
  page: number;
  limit: number;
}

export interface Page<T> extends PageParams {
  data: T[];
  total: number;
  totalPages: number;
}

export function pageParams(input: PaginationQueryDto): PageParams {
  return {
    page: Number(input.page ?? '1'),
    limit: Number(input.limit ?? '20'),
  };
}

export function buildPage<T>(
  data: T[],
  params: PageParams,
  total: number,
): Page<T> {
  return {
    data,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}
