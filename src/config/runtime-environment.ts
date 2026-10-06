import { AppEnvironment, validateEnvironment } from './environment';
import {
  DatabaseEnvironment,
  validateDatabaseEnvironment,
} from '../database/database.config';

export interface RuntimeEnvironment
  extends AppEnvironment, DatabaseEnvironment {}

export function validateRuntimeEnvironment(
  environment: Record<string, unknown>,
): RuntimeEnvironment {
  return {
    ...validateEnvironment(environment),
    ...validateDatabaseEnvironment(environment),
  };
}
