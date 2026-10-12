import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthRequest } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ApiErrors } from '../common/openapi';
import { BEARER_SCHEME } from '../swagger';
import { ChangeRoleDto, CreateUserDto, ListUsersDto } from './users.dto';
import { UserPageResponse, UserResponse } from './users.responses';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth(BEARER_SCHEME)
@ApiErrors(401, 403)
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear usuario (solo admin)',
    description: 'No hay registro público; el admin comunica la contraseña.',
  })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiErrors(400, [409, 'El username ya existe.'])
  create(@Req() request: AuthRequest, @Body() body: CreateUserDto) {
    return this.users.create(request.identity!, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios paginados (solo admin)' })
  @ApiOkResponse({ type: UserPageResponse })
  @ApiErrors(400)
  list(@Req() request: AuthRequest, @Query() query: ListUsersDto) {
    return this.users.list(request.identity!, query);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Cambiar rol (solo admin)',
    description: 'Los nuevos permisos aplican desde la siguiente petición.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID v4 del usuario.' })
  @ApiOkResponse({ type: UserResponse })
  @ApiErrors(
    400,
    [404, 'Usuario no encontrado.'],
    [409, 'No se puede degradar al último admin registrado.'],
  )
  changeRole(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ChangeRoleDto,
  ) {
    return this.users.changeRole(request.identity!, id, body.role);
  }
}
