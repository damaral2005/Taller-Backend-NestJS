import {
  configuredDataSource,
  runCommand,
  withDataSource,
} from '../database/commands';
import { issueEnrollment } from './enrollment';

export async function enrollFromEnvironment(
  username: string | undefined,
): Promise<void> {
  if (!username) throw new Error('Indica el username para enrolar.');
  const source = await configuredDataSource();
  const result = await withDataSource(source, (connection) =>
    issueEnrollment(connection, username),
  );
  // Esta credencial se muestra solo en el script privado, nunca en logs HTTP.
  console.log(JSON.stringify(result));
}

if (require.main === module)
  void runCommand(() => enrollFromEnvironment(process.argv[2]));
