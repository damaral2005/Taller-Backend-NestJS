import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, AuthRequest } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateMovementDto, ListMovementsDto } from './movements.dto';
import { MovementsService } from './movements.service';

@Controller('movements')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'operador')
export class MovementsController {
  constructor(private readonly movements: MovementsService) {}

  @Post()
  create(@Req() request: AuthRequest, @Body() body: CreateMovementDto) {
    return this.movements.create(request.identity!, body);
  }

  @Get()
  list(@Query() query: ListMovementsDto) {
    return this.movements.list(query);
  }
}
