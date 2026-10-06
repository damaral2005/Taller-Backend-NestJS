import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateRuntimeEnvironment } from './config/runtime-environment';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      skipProcessEnv: true,
      validate: validateRuntimeEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
