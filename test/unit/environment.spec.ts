import { validateEnvironment } from '../../src/config/environment';

describe('Configuración de la aplicación', () => {
  it('usa valores por defecto cuando no hay variables', () => {
    expect(validateEnvironment({})).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it.each(['development', 'test', 'production'])(
    'acepta el entorno %s',
    (NODE_ENV) => {
      expect(validateEnvironment({ NODE_ENV }).NODE_ENV).toBe(NODE_ENV);
    },
  );

  it.each(['1', '3000', '65535'])(
    'convierte el puerto válido %s a número',
    (PORT) => {
      expect(validateEnvironment({ PORT }).PORT).toBe(Number(PORT));
    },
  );

  it.each([
    '',
    '0',
    '-1',
    '65536',
    '3000.5',
    '3000abc',
    ' 3000 ',
    '1e3',
    '9007199254740993',
    3000,
  ])('rechaza un puerto inválido (%s)', (PORT) => {
    expect(() => validateEnvironment({ PORT })).toThrow(
      'PORT debe ser un entero entre 1 y 65535.',
    );
  });

  it.each(['', 'staging', 123])(
    'rechaza un entorno inválido (%s)',
    (NODE_ENV) => {
      expect(() => validateEnvironment({ NODE_ENV })).toThrow(
        'NODE_ENV debe ser development, test o production.',
      );
    },
  );

  it('el error no expone valores recibidos ni otras variables', () => {
    expect(() =>
      validateEnvironment({
        PORT: 'valor-confidencial',
        OTHER: 'dato-privado',
      }),
    ).toThrow(/^PORT debe ser un entero entre 1 y 65535\.$/);
  });
});
