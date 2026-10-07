# Taller Backend NestJS — API de inventario

Backend académico para administrar productos, existencias y movimientos de inventario con NestJS y PostgreSQL. El proyecto se desarrolla mediante **Spec-Driven Design con archivos versionados**: especificar, planificar, implementar, verificar y actualizar la documentación en cada commit.

Repositorio: [Taller-Backend-NestJS](https://github.com/damaral2005/Taller-Backend-NestJS).

## Estado actual

Los commits 1 y 2 establecen el SDD y la base NestJS. El commit 3 incorpora PostgreSQL y seed; el 4 añade JWT/TOTP y sesiones revocables. El incremento 5 implementa administración de usuarios y roles con protección del último admin. Sus verificaciones y estado de cierre se registran en el overview. **Catálogo, movimientos y despliegue siguen pendientes.**

El código incluye health, seis rutas de autenticación y tres rutas administrativas de usuarios. Los contratos de inventario de la especificación 001 representan funcionalidades futuras.

La carpeta `2026-2-nestjs-postgres` se utiliza como referencia del curso. El desarrollo propio se realiza en `Taller Backend – NestJS`; no se modifica el ejemplo ni se copia su historial.

## Documentación

- [Especificación: alcance, reglas, endpoints previstos y rúbrica](specs/001-inventory/spec.md).
- [Plan técnico y alcance de los primeros tres commits](specs/001-inventory/plan.md).
- [Tareas y estado de avance](specs/001-inventory/tasks.md).
- [Decisiones y asuntos pendientes](docs/decisions.md).
- [Overview y verificación del commit 1](docs/commits/001.md).
- [Especificación de la base ejecutable](specs/002-bootstrap/spec.md), [plan](specs/002-bootstrap/plan.md) y [tareas](specs/002-bootstrap/tasks.md).
- [Overview y verificación del commit 2](docs/commits/002.md).
- [Especificación de persistencia y seed](specs/003-persistence/spec.md), [plan](specs/003-persistence/plan.md) y [tareas](specs/003-persistence/tasks.md).
- [Overview y verificación del commit 3](docs/commits/003.md).
- [Especificación de autenticación](specs/004-authentication/spec.md), [plan](specs/004-authentication/plan.md) y [tareas](specs/004-authentication/tasks.md).
- [Overview y verificación del commit 4](docs/commits/004.md).
- [Especificación de administración y roles](specs/005-users/spec.md), [plan](specs/005-users/plan.md) y [tareas](specs/005-users/tasks.md).
- [Overview y verificaciones del commit 5](docs/commits/005.md).
- [Guía para colaborar con Spec-Driven Design](docs/CONTRIBUTING.md).

## Flujo de trabajo por commit

1. Revisar la especificación, las decisiones y la tarea que corresponde.
2. Actualizar primero los criterios de aceptación si cambia el comportamiento previsto.
3. Implementar únicamente el alcance del commit actual.
4. Ejecutar las comprobaciones aplicables y registrar los resultados reales.
5. Actualizar especificación, plan, tareas y overview antes de cerrar el commit.
6. Revisar con el grupo el overview antes de iniciar el siguiente commit.

Los cambios de alcance se registran; una tarea pendiente no se presenta como completada. Los commits deben reflejar las contribuciones reales de cada integrante, sin atribuir trabajo a otras personas.

## Incrementos

| Commit | Alcance                                                            | Estado                                                        |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1      | Especificación de inventario, rúbrica y flujo de trabajo           | Cerrado; usuario autorizó avanzar                             |
| 2      | Base NestJS, configuración, validación, health y pruebas iniciales | Ver resultados y estado en el [overview](docs/commits/002.md) |
| 3      | PostgreSQL, migración inicial, seed y pruebas de persistencia      | Ver resultados y estado en el [overview](docs/commits/003.md) |
| 4      | JWT, enrolamiento TOTP, sesiones revocables y guards               | Ver resultados y estado en el [overview](docs/commits/004.md) |
| 5      | Crear/listar usuarios, asignar roles y proteger al último admin    | Ver resultados y estado en el [overview](docs/commits/005.md) |

Inventario, colección Postman, informe y despliegue se desarrollarán en incrementos posteriores. Estos incrementos no completan la entrega.

## Requisitos y ejecución

- Node.js **24**, versión 24.15.0 o superior dentro de esa versión mayor (`.nvmrc`).
- npm **11**.
- Docker Desktop iniciado, con motor Linux y Docker Compose, para ejecutar PostgreSQL **16.15**. También puede usarse un servidor PostgreSQL externo configurando las variables de conexión.

Desde la raíz del repositorio:

```bash
npm ci
```

Crear la configuración local en PowerShell:

```powershell
Copy-Item .env.example .env
```

En Bash se puede usar `cp .env.example .env`. El archivo `.env` no se versiona. Si ya existe, incorpora las nuevas variables sin reemplazar tus valores. Las credenciales del ejemplo son solo de demostración local; establece valores propios en cualquier entorno compartido.

Antes del primer arranque, genera las dos claves de autenticación independientes en `.env` (comando válido en PowerShell y Bash):

```bash
node -e "const fs = require('node:fs'), c = require('node:crypto'); fs.appendFileSync('.env', '\nJWT_SECRET=' + c.randomBytes(32).toString('hex') + '\nTOTP_ENCRYPTION_KEY=' + c.randomBytes(32).toString('hex') + '\n');"
```

Ejecuta ese comando una sola vez al configurar tu entorno. Conserva las claves: cambiarlas invalida JWT o impide descifrar factores ya enrolados; la rotación requiere un procedimiento que aún no se implementa. En la instalación local de este trabajo ya se generaron, sin publicarlas.

| Variable              | Por defecto         | Regla                                                                |
| --------------------- | ------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`            | `development`       | `development`, `test` o `production`                                 |
| `PORT`                | `3000`              | Entero entre 1 y 65535, escrito solo con dígitos                     |
| `DB_HOST`             | `127.0.0.1`         | Host de PostgreSQL                                                   |
| `DB_PORT`             | `5433`              | Entero entre 1 y 65535                                               |
| `DB_NAME`             | `inventory`         | Identificador en minúsculas; en test debe terminar en `_test`        |
| `DB_USERNAME`         | `inventory`         | Usuario de PostgreSQL                                                |
| `DB_PASSWORD`         | Sin valor en código | Obligatoria; `.env.example` contiene una clave de demostración local |
| `DB_SCHEMA`           | `public`            | Identificador en minúsculas, máximo 63 caracteres                    |
| `DB_SSL`              | `false`             | `true` o `false`; con `true` se verifica el certificado              |
| `JWT_SECRET`          | Sin valor           | Al menos 32 bytes; independiente de la clave TOTP                    |
| `TOTP_ENCRYPTION_KEY` | Sin valor           | 64 caracteres hexadecimales: clave AES-256-GCM                       |

Preparar la base y cargar los registros iniciales:

```bash
npm run db:up
npm run migration:run
npm run seed
```

Los comandos de migración y seed compilan el proyecto antes de ejecutarse. El seed requiere `SEED_ADMIN_PASSWORD` y `SEED_OPERATOR_PASSWORD` de 12 a 128 caracteres, declaradas en `.env` o en el proceso. Crea `admin`, `operador`, tres productos y entradas iniciales con saldos 20, 30 y 10. Las contraseñas se guardan con scrypt y salt aleatoria.

Repetir `npm run seed` conserva contraseñas, roles, catálogo, saldos e historial existentes y no aplica de nuevo las entradas ya identificadas. Si existe un producto activo sin su entrada inicial, se añade esa entrada a su saldo previo; si está inactivo, se rechaza la carga completa. Todo el seed es una transacción. Para iniciar sesión, primero enrola el segundo factor según el recorrido siguiente.

Desarrollo tiene un volumen persistente en Docker. `docker compose stop postgres` detiene ese servicio conservando los datos, y `npm run db:up` lo vuelve a iniciar. No es necesario borrar volúmenes para repetir el seed.

`npm run migration:revert` revierte la última migración: la de autenticación elimina sesiones y factores; la inicial elimina inventario/usuarios. Ambas reversiones **eliminan datos** y se prueban solo sobre bases descartables. La aplicación no ejecuta migraciones ni seed al arrancar; `synchronize` y `dropSchema` están desactivados.

Las variables del proceso prevalecen sobre `.env`. Cuando `NODE_ENV=test`, no se carga `.env`. Una configuración inválida impide arrancar y el mensaje indica qué variable corregir sin mostrar su valor.

```bash
npm run start:dev
```

Consultar `http://localhost:3000/api/v1/health` (o el puerto configurado):

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/health
```

Respuesta HTTP `200`:

```json
{ "status": "ok" }
```

Es una comprobación pública de disponibilidad del proceso. La ruta `/health` sin prefijo devuelve `404`.

Para ejecutar el build:

```bash
npm run build
npm run start:prod
```

## Autenticación: recorrido manual

Con migraciones aplicadas y API iniciada, emite en otra terminal una credencial privada para un usuario del seed:

```bash
npm run auth:enroll -- admin
```

El script devuelve `{enrollmentToken, expiresIn:900}`. No permite resetear un usuario que ya tiene TOTP; una nueva emisión invalida el enrolamiento anterior. Esa credencial solo sirve para setup/confirmación, nunca para acceder a inventario. No publiques su salida ni el secreto del setup.

Ejemplo PowerShell (sustituye los dos placeholders con tus valores locales):

```powershell
$base = 'http://localhost:3000/api/v1'
$enrollment = '<enrollmentToken_del_script>'
$setup = Invoke-RestMethod -Method Post "$base/auth/2fa/setup" -ContentType 'application/json' -Body (@{ enrollmentToken = $enrollment } | ConvertTo-Json)
# Añade $setup.secret manualmente en tu aplicación autenticadora: TOTP, SHA1, 6 dígitos, 30 segundos.
# $setup.uri también permite importar el factor en una aplicación compatible.
$confirmCode = Read-Host 'Código de la aplicación autenticadora'
Invoke-RestMethod -Method Post "$base/auth/2fa/confirm" -ContentType 'application/json' -Body (@{ enrollmentToken = $enrollment; code = $confirmCode } | ConvertTo-Json)
$challenge = Invoke-RestMethod -Method Post "$base/auth/login" -ContentType 'application/json' -Body (@{ username = 'admin'; password = '<SEED_ADMIN_PASSWORD>' } | ConvertTo-Json)
# Espera el siguiente código: el utilizado para confirmar ya está consumido.
$loginCode = Read-Host 'Nuevo código del autenticador'
$session = Invoke-RestMethod -Method Post "$base/auth/verify-2fa" -ContentType 'application/json' -Body (@{ challengeToken = $challenge.challengeToken; code = $loginCode } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($session.accessToken)" }
Invoke-RestMethod "$base/auth/me" -Headers $headers
Invoke-RestMethod -Method Post "$base/auth/logout" -Headers $headers
# Repetir /auth/me con los mismos headers debe fallar con 401.
```

| Ruta                     | Entrada                                | Resultado                                                   |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| `POST /auth/2fa/setup`   | `enrollmentToken`                      | `201`: secreto/URI TOTP exclusivamente para enrolamiento    |
| `POST /auth/2fa/confirm` | `enrollmentToken`, `code` de 6 dígitos | `200`: `{enabled:true}`                                     |
| `POST /auth/login`       | `username`, `password`                 | `200`: desafío de 5 minutos; todavía no hay JWT             |
| `POST /auth/verify-2fa`  | `challengeToken`, `code`               | `200`: JWT Bearer de 15 minutos                             |
| `GET /auth/me`           | Bearer JWT                             | `200`: `{id,username,role}` sin secretos                    |
| `POST /auth/logout`      | Bearer JWT                             | `204`: sesión revocada; después el mismo JWT devuelve `401` |

Las rutas son relativas a `/api/v1`. Se rechazan campos adicionales con `400`; credenciales/códigos/pruebas inválidos, consumidos o vencidos con `401`; exceso de peticiones con `429`. Username canónico y contraseña de 12–128 caracteres. Cinco fallos de contraseña bloquean login 15 minutos; cinco fallos TOTP por cuenta bloquean 2FA y desafíos nuevos 15 minutos. El límite por IP/ruta es 20 peticiones/minuto en memoria por proceso. TOTP admite ±1 paso y cada contador puede consumirse una sola vez por usuario.

Los secretos se cifran con AES-256-GCM, las credenciales temporales solo se guardan como digest SHA256 y todas las respuestas auth llevan `Cache-Control: no-store`. El guard comprueba JWT y sesión en PostgreSQL y toma el rol vigente de BD. Administración utiliza además el guard de roles con acceso exclusivo para admin. No hay recuperación de 2FA, refresh tokens ni rotación de claves automatizada; no se puede saltar 2FA usando solo la contraseña.

## Administración de usuarios y roles

Después de completar login/2FA como admin, usa el Bearer JWT obtenido. Un operador recibe `403` y una petición sin sesión válida recibe `401` en las tres rutas. No existe registro público.

| Ruta relativa a `/api/v1` | Parámetros                                                 | Respuesta                                     |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `POST /users`             | JSON `username`, `password`, `role` (`admin` u `operador`) | `201`: `{user,enrollmentToken,expiresIn:900}` |
| `GET /users`              | `page` opcional 1–10000, `limit` opcional 1–100            | `200`: `{data,page,limit,total,totalPages}`   |
| `PATCH /users/:id/role`   | UUID v4, JSON `{role}`                                     | `200`: usuario seguro actualizado             |

Usuario seguro contiene solo `id`, `username`, `role`, `createdAt` y `updatedAt`, con fechas ISO-8601. El listado no devuelve credenciales ni factores. La credencial que entrega creación sirve únicamente para que el nuevo usuario configure/confirme TOTP usando las rutas existentes; debe comunicarse privadamente y nunca versionarse. Usuario y credencial se crean en una sola transacción.

Username debe ser canónico: 3–64 caracteres, minúsculas ASCII, dígitos y `._-`, empezando por letra/dígito. Password de 12–128 caracteres, sin transformación. Body/query con campos extra, UUID/rol/formato inválido → `400`; username duplicado → `409`; destino inexistente → `404`. No se aceptan campos para editar hash, factor, contraseña o stock en el cambio de rol.

Paginación predeterminada: página 1, límite 20. Query debe contener dígitos sin ceros iniciales; no se aceptan signos, espacios, exponentes, fracciones ni valores repetidos/arrays. Orden por username e ID; una página fuera del total devuelve `data:[]`.

Se rechaza con `409` degradar al último admin registrado o al único admin con 2FA activo. Crear otro admin sin enrolar no permite degradar al único admin capaz de autenticarse. El rol idéntico es idempotente; cambiarlo conserva contraseña, factor e historial. La misma sesión refleja sus nuevos permisos sin volver a iniciar sesión. Transacciones con bloqueo asesor serializan cambios administrativos y revalidan sesión/rol al salir de la espera, protegiendo contra cambios concurrentes. Todas las respuestas de administración, incluidos errores, llevan `Cache-Control: no-store`.

Ejemplo PowerShell después del recorrido de autenticación anterior (`$base` y `$headers` siguen definidos; utiliza una sesión vigente que no hayas cerrado):

```powershell
$newUser = Invoke-RestMethod -Method Post "$base/users" -Headers $headers -ContentType 'application/json' -Body (@{ username = 'nuevo_operador'; password = '<contraseña_propia_de_12_a_128_caracteres>'; role = 'operador' } | ConvertTo-Json)
# Comunica $newUser.enrollmentToken privadamente para configurar/confirmar TOTP.
Invoke-RestMethod "$base/users?page=1&limit=20" -Headers $headers
Invoke-RestMethod -Method Patch "$base/users/$($newUser.user.id)/role" -Headers $headers -ContentType 'application/json' -Body (@{ role = 'admin' } | ConvertTo-Json)
```

El enrolamiento privado por script sigue disponible para usuarios existentes sin TOTP si su credencial inicial venció; no resetea factores activos. El incremento 5 no necesita migración ni dependencias nuevas: reutiliza el esquema de usuarios y autenticación.

## Pruebas y verificaciones

| Comando                               | Función                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| `npm run format:check`                | Comprueba formato sin editar                                 |
| `npm run lint`                        | Comprueba reglas de TypeScript sin editar                    |
| `npm run typecheck`                   | Verifica tipos de aplicación y pruebas                       |
| `npm run build`                       | Compila la aplicación a `dist/`, sin controladores de prueba |
| `npm test`                            | Unidades Jest de configuración, credenciales y hash          |
| `npm run test:e2e`                    | HTTP Supertest y persistencia/seed con PostgreSQL real       |
| `npm run test:cov`                    | Unidades e integración con cobertura mínima del 80%          |
| `npm run format` / `npm run lint:fix` | Corrección manual de formato / lint                          |
| `npm run db:test:up`                  | Arranca PostgreSQL independiente para pruebas                |

Antes de las pruebas HTTP o de cobertura:

```bash
npm run db:test:up
npm run test:cov
```

La base de pruebas por defecto es `inventory_test`, con usuario `inventory_test`, puerto `5434` y contraseña local de demostración `inventory_test_local`. El servicio `postgres-test` tiene almacenamiento temporal e independiente del volumen de desarrollo. Las suites de persistencia crean un esquema aleatorio exclusivo, aplican migraciones y eliminan solo ese esquema al terminar.

Las pruebas ignoran `.env` y no heredan `DB_*` de desarrollo. Para otro servidor se definen `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_NAME`, `TEST_DB_USERNAME` y `TEST_DB_PASSWORD` en el proceso. `TEST_DB_NAME` debe terminar en `_test`. Por ejemplo, en PowerShell: `$env:TEST_DB_PORT = '5435'`; en Bash: `export TEST_DB_PORT=5435`. Usa esos mismos valores al levantar el servicio y al ejecutar las pruebas.

La cobertura incluye todos los archivos de `src` salvo tests y se exige en líneas, sentencias, funciones y ramas. El reporte se escribe en `coverage/`; se puede consultar `coverage/lcov-report/index.html` y `coverage/coverage-summary.json`. Los resultados medidos de este incremento se registran en su overview y no representan todavía cobertura del dominio completo.

Las pruebas HTTP cierran sus servidores al terminar y usan puertos efímeros para verificar el listener. El controlador de validación existe únicamente en `test/` y no se distribuye con la API.

Los scripts habilitan las VM de módulos de Node para cargar las dependencias ESM de NestJS 12 y desactivan Watchman por CLI. Haste sigue los enlaces para incluir también los archivos que OneDrive anuncia como reparse points; no es necesario añadir flags manualmente. En el incremento 5 pasan **184 pruebas en 13 suites**, con **98,70% de cobertura de líneas** y las cuatro métricas por encima del 80%. El [overview](docs/commits/005.md) registra resultados y límites.

## Integración continua

[El workflow de CI](.github/workflows/ci.yml) se ejecuta en GitHub Actions ante push o pull request: instala desde lockfile en Node 24, levanta un servicio PostgreSQL de pruebas, revisa formato, lint y tipos, compila y ejecuta pruebas con cobertura. Conserva el reporte como artefacto. Su ejecución remota requiere publicar los commits en GitHub; no se ha configurado despliegue todavía.

## Estructura actual

```text
src/
  config/environment.ts   # Validación de configuración
  config/runtime-environment.ts # Configuración HTTP y PostgreSQL
  database/               # Conexión, comandos y migración inicial
  users/                  # Entidad, administración y roles
  products/entities/      # Producto y stock
  movements/entities/     # Historial con usuario y producto
  seed/                   # Credenciales, hash y carga transaccional
  auth/                   # Enrolamiento, TOTP, JWT, sesiones y guards
  health/                 # Endpoint público de salud
  app.module.ts           # Configuración global y módulos
  configure-app.ts        # Prefijo, pipe y hooks compartidos
  bootstrap.ts            # Creación y arranque del servidor
  main.ts                 # Punto de entrada del proceso
test/                     # Unidades e integración HTTP/PostgreSQL
specs/                    # Especificaciones, planes y tareas versionadas
docs/                     # Decisiones y overview por commit
.github/workflows/ci.yml   # Checks automatizados
```

La siguiente fase implementará catálogo de productos con su propia especificación antes del código. Consulta la [guía del grupo](docs/CONTRIBUTING.md) para preparar tu incremento.

## Entrega final pendiente

La entrega deberá incluir código fuente, pruebas Jest y Supertest con cobertura mínima del 80%, colección y entorno Postman sin secretos, instrucciones completas, informe de endpoints y arquitectura, pipeline de pruebas y despliegue automatizado, URL del repositorio y URL de la API desplegada. El informe debe adjuntarse a la tarea de Intu.
