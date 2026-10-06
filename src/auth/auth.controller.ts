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
import { ConfirmDto, EnrollmentDto, LoginDto, VerifyDto } from './auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('2fa/setup')
  @Header('Cache-Control', 'no-store')
  setup(@Body() body: EnrollmentDto) {
    return this.auth.setup(body.enrollmentToken);
  }
  @Post('2fa/confirm')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  confirm(@Body() body: ConfirmDto) {
    return this.auth.confirm(body.enrollmentToken, body.code);
  }
  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.username, body.password);
  }
  @Post('verify-2fa')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  verify(@Body() body: VerifyDto) {
    return this.auth.verify(body.challengeToken, body.code);
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
