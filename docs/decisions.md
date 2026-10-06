# Registro de decisiones

| ID   | Decisión                                                                              | Estado                                           | Motivo                                                                                                  |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| D-01 | Desarrollar en `Taller Backend – NestJS`; usar `2026-2-nestjs-postgres` como ejemplo. | Confirmada por contexto del usuario e inspección | La primera está vacía y la segunda contiene el ejemplo del curso.                                       |
| D-02 | Trabajar con `https://github.com/damaral2005/Taller-Backend-NestJS.git`.              | Confirmada por usuario                           | Es el repositorio de la entrega; inicialmente vacío.                                                    |
| D-03 | Elegir inventario y Spec-Driven Design con archivos versionados.                      | Confirmada por usuario                           | Respuesta del 2026-10-06; no se requiere instalar Spec Kit.                                             |
| D-04 | Cerrar y revisar un commit antes de implementar el siguiente.                         | Confirmada por usuario                           | Permite revisar cambios y mantener SDD actualizado.                                                     |
| D-05 | Productos, saldo y movimientos en un inventario; cantidades enteras.                  | Alcance inicial aceptado al avanzar              | Usuario autorizó el commit 2 tras el overview, sin cambios de alcance.                                  |
| D-06 | Roles `admin` y `operador`, usuarios creados por admin.                               | Alcance inicial aceptado al avanzar              | Cubre administración de roles y permisos distintos sin registro público.                                |
| D-07 | TOTP como 2FA y sesiones persistidas para revocar JWT.                                | Implementada y verificada en commit 4            | Cumple dos factores y logout verificable en el servidor.                                                |
| D-08 | PostgreSQL, TypeORM, migraciones y seed por script idempotente.                       | Plan técnico inicial                             | Satisface persistencia y evita una ruta pública de carga de datos.                                      |
| D-09 | Primeros commits: SDD, base NestJS, persistencia/seed.                                | Segundo commit autorizado                        | Cada cambio se puede validar por separado; seguridad y dominio siguen después.                          |
| D-10 | Node 24, npm 11 y TypeScript estricto con CommonJS.                                   | Resuelta para commit 2                           | Coincide con el runtime local y permite usar Jest según la rúbrica.                                     |
| D-11 | NestJS 12.1.2, Config 12.0.1, TypeScript 5.9.3, Jest 30.5.2 y ts-jest 29.4.14.        | Metadata y peer dependencies verificadas en npm  | Las versiones exactas se fijan en package.json y el lockfile. TypeORM se verifica en el commit 3.       |
| D-12 | Health solo comprueba el proceso HTTP; prefijo `/api/v1`.                             | Implementación del commit 2                      | Evita declarar disponibilidad de una base de datos aún no conectada.                                    |
| D-13 | Cobertura conjunta de unidades y HTTP, sin excluir archivos de arranque ni módulos.   | Configurada para commit 2                        | El umbral del 80% aplica a las cuatro métricas; las nuevas funcionalidades también se incluirán.        |
| D-14 | ESLint 10.12.0 y @eslint/js 10.0.1 con typescript-eslint 8.71.1.                      | Compatibilidad verificada en npm                 | ESLint 9 ya no tiene soporte; las versiones elegidas aceptan Node 24 y el analizador soporta ESLint 10. |

## Pendientes y momento de resolución

Decisiones del commit 3:

- D-15: `@nestjs/typeorm` 12.0.2, TypeORM 1.1.1 y `pg` 8.23.1, con compatibilidad verificada en npm y versiones exactas en el lockfile.
- D-16: PostgreSQL 16.15-alpine; desarrollo en 5433 con volumen y pruebas en 5434 con almacenamiento temporal, publicados solo en localhost.
- D-17: saldo almacenado, movimientos con FK `RESTRICT`, username/SKU canónicos y restricciones en la migración. No hay sincronización automática de esquema.
- D-18: seed en una transacción con bloqueo asesor, claves estables y preservación de datos existentes. Hash scrypt de Node con `N=32768, r=8, p=3` y salt aleatoria.
- D-19: cada suite de PostgreSQL crea y elimina solo un esquema propio dentro de una base con sufijo `_test`. La configuración de test no hereda la conexión de desarrollo.

El código propio se compila a CommonJS; NestJS 12 distribuye dependencias ESM. Los scripts de pruebas habilitan las VM de módulos de Node para que Jest pueda cargarlas, según su documentación oficial. No se simula Nest ni se excluyen estas pruebas para resolver la compatibilidad.

| ID   | Decisión pendiente                                                                                                                    | Resolver antes de                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| P-04 | Recuperación 2FA, rotación de claves y política de último admin; TOTP, expiraciones, límites y enrolamiento inicial resueltos en 004. | Ampliar mantenimiento y administración   |
| P-05 | Campos exactos de DTOs, paginación y formato uniforme de errores.                                                                     | Implementar cada ruta                    |
| P-06 | Integrantes y autoría de contribuciones reales.                                                                                       | Revisar participación y preparar entrega |
| P-07 | Proveedor de nube, base de datos, credenciales y estrategia de migración/despliegue.                                                  | Implementar despliegue                   |

El ejemplo puede orientar la estructura modular y los DTOs; no demuestra cumplimiento de JWT, 2FA, roles, cobertura ni despliegue. No se reutilizan passwords, secretos o datos personales de otros entornos.

Decisiones del commit 4:

- D-20: `@nestjs/jwt` 12.0.2, OTPAuth 9.5.2 y Throttler 6.7.1, compatibles y fijados. JWT HS256 con issuer/audience y sesión de 15 minutos, sin refresh.
- D-21: TOTP SHA1/6 dígitos/30 segundos y ventana ±1; cifrado AES-256-GCM con clave separada, AAD por propósito/usuario y contador persistido sin replay.
- D-22: enrolamiento inicial emitido por script privado, 15 minutos; desafío 5 minutos. Tokens aleatorios de 32 bytes guardados como digest; bloqueos transaccionales serializan verificación y consumo.
- D-23: cinco fallos de contraseña o TOTP por cuenta bloquean el factor 15 minutos. Las pruebas limitadas también tienen cinco intentos; solicitar desafíos nuevos no evita el bloqueo TOTP. Throttler limita IP/ruta a 20/minuto por proceso; almacenamiento compartido se resolverá para múltiples réplicas.
- D-24: autenticación completa y guards reutilizables en 004; administración, recuperación 2FA y dominio en siguientes incrementos. El usuario autorizó publicación de los cuatro commits.
- D-25: se añade `docs/CONTRIBUTING.md` para coordinar responsables, contratos, pruebas, overview y revisión por incremento con el grupo.
