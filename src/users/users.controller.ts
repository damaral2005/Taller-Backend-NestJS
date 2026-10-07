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
import { AuthGuard, AuthRequest } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ChangeRoleDto, CreateUserDto, ListUsersDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Req() request: AuthRequest, @Body() body: CreateUserDto) {
    return this.users.create(request.identity!, body);
  }

  @Get()
  list(@Req() request: AuthRequest, @Query() query: ListUsersDto) {
    return this.users.list(request.identity!, query);
  }

  @Patch(':id/role')
  changeRole(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ChangeRoleDto,
  ) {
    return this.users.changeRole(request.identity!, id, body.role);
  }
}
