import { INestApplication, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApplication } from './configure-app';
import { AppEnvironment } from './config/environment';

export async function createApplication(
  options: NestApplicationOptions = {},
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    ...options,
    abortOnError: false,
  });
  configureApplication(app);
  return app;
}

export async function startApplication(app: INestApplication): Promise<void> {
  const config = app.get<ConfigService<AppEnvironment, true>>(ConfigService);

  try {
    await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
  } catch (error) {
    await app.close();
    throw error;
  }
}
