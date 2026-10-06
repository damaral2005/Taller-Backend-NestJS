export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
}

export function parsePort(value: unknown, variable: string): number {
  const message = `${variable} debe ser un entero entre 1 y 65535.`;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error(message);
  }
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error(message);
  }
  return port;
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): AppEnvironment {
  const nodeEnv = environment.NODE_ENV ?? 'development';

  if (
    nodeEnv !== 'development' &&
    nodeEnv !== 'test' &&
    nodeEnv !== 'production'
  ) {
    throw new Error('NODE_ENV debe ser development, test o production.');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: parsePort(environment.PORT ?? '3000', 'PORT'),
  };
}
