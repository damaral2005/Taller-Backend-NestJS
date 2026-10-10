import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard, AuthRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.username, body.password);
  }
  @Get('me')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthRequest) {
    const { id, username, role } = request.identity!;
    return { id, username, role };
  }
  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  logout(@Req() request: AuthRequest) {
    return this.auth.logout(request.identity!);
  }
}
