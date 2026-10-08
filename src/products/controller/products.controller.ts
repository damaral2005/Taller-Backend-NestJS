import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import {
  CreateProductDto,
  ListProductsDto,
  SetProductStatusDto,
  UpdateProductDto,
} from './products.dto';
import { ProductsService } from './products.service';

// Lectura: cualquier usuario autenticado. Escritura: solo admin (por ruta).
@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreateProductDto) {
    return this.products.create(body);
  }

  @Get()
  list(@Query() query: ListProductsDto) {
    return this.products.list(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.products.update(id, body);
  }

  @Patch(':id/status')
  @Roles('admin')
  setStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: SetProductStatusDto,
  ) {
    return this.products.setStatus(id, body.active);
  }
}