# Taller Backend NestJS — API de inventario

Backend académico para administrar productos, existencias y movimientos de inventario con NestJS y PostgreSQL. El proyecto se desarrolla mediante **Spec-Driven Design con archivos versionados**: especificar, planificar, implementar, verificar y actualizar la documentación en cada commit.

Repositorio: [Taller-Backend-NestJS](https://github.com/damaral2005/Taller-Backend-NestJS).

## Estado actual

Los commits 1 y 2 establecen el SDD y la base NestJS. El commit 3 incorpora PostgreSQL, entidades, migración inicial, seed transaccional y pruebas reales de persistencia. **Todavía no hay rutas de autenticación, administración de usuarios, catálogo o movimientos, ni despliegue.**

Solo health está disponible. Los demás contratos de la especificación 001 representan funcionalidades futuras.

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

## Flujo de trabajo por commit

1. Revisar la especificación, las decisiones y la tarea que corresponde.
2. Actualizar primero los criterios de aceptación si cambia el comportamiento previsto.
3. Implementar únicamente el alcance del commit actual.
4. Ejecutar las comprobaciones aplicables y registrar los resultados reales.
5. Actualizar especificación, plan, tareas y overview antes de cerrar el commit.
6. Revisar con el grupo el overview antes de iniciar el siguiente commit.

Los cambios de alcance se registran; una tarea pendiente no se presenta como completada. Los commits deben reflejar las contribuciones reales de cada integrante, sin atribuir trabajo a otras personas.

## Primeros tres commits

| Commit | Alcance                                                            | Estado                                                        |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1      | Especificación de inventario, rúbrica y flujo de trabajo           | Cerrado; usuario autorizó avanzar                             |
| 2      | Base NestJS, configuración, validación, health y pruebas iniciales | Ver resultados y estado en el [overview](docs/commits/002.md) |
| 3      | PostgreSQL, migración inicial, seed y pruebas de persistencia      | Ver resultados y estado en el [overview](docs/commits/003.md) |

JWT con 2FA, permisos, operaciones completas de inventario, colección Postman, informe y despliegue se desarrollarán en incrementos posteriores. Estos tres commits iniciales no completan la entrega.

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

| Variable      | Por defecto         | Regla                                                                |
| ------------- | ------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`    | `development`       | `development`, `test` o `production`                                 |
| `PORT`        | `3000`              | Entero entre 1 y 65535, escrito solo con dígitos                     |
| `DB_HOST`     | `127.0.0.1`         | Host de PostgreSQL                                                   |
| `DB_PORT`     | `5433`              | Entero entre 1 y 65535                                               |
| `DB_NAME`     | `inventory`         | Identificador en minúsculas; en test debe terminar en `_test`        |
| `DB_USERNAME` | `inventory`         | Usuario de PostgreSQL                                                |
| `DB_PASSWORD` | Sin valor en código | Obligatoria; `.env.example` contiene una clave de demostración local |
| `DB_SCHEMA`   | `public`            | Identificador en minúsculas, máximo 63 caracteres                    |
| `DB_SSL`      | `false`             | `true` o `false`; con `true` se verifica el certificado              |

Preparar la base y cargar los registros iniciales:

```bash
npm run db:up
npm run migration:run
npm run seed
```

Los comandos de migración y seed compilan el proyecto antes de ejecutarse. El seed requiere `SEED_ADMIN_PASSWORD` y `SEED_OPERATOR_PASSWORD` de 12 a 128 caracteres, declaradas en `.env` o en el proceso. Crea `admin`, `operador`, tres productos y entradas iniciales con saldos 20, 30 y 10. Las contraseñas se guardan con scrypt y salt aleatoria.

Repetir `npm run seed` conserva contraseñas, roles, catálogo, saldos e historial existentes y no aplica de nuevo las entradas ya identificadas. Si existe un producto activo sin su entrada inicial, se añade esa entrada a su saldo previo; si está inactivo, se rechaza la carga completa. Todo el seed es una transacción. Todavía no puede iniciarse sesión: JWT y enrolamiento 2FA se implementarán después.

Desarrollo tiene un volumen persistente en Docker. `docker compose stop postgres` detiene ese servicio conservando los datos, y `npm run db:up` lo vuelve a iniciar. No es necesario borrar volúmenes para repetir el seed.

`npm run migration:revert` revierte la última migración. La reversión inicial **elimina las tablas y sus datos**: se utiliza solo sobre bases descartables. La aplicación no ejecuta migraciones ni seed al arrancar; `synchronize` y `dropSchema` están desactivados.

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

Los scripts ya habilitan las VM de módulos de Node para que Jest cargue las dependencias ESM de NestJS 12; no es necesario añadir flags manualmente. En el commit 3 pasan **94 pruebas**, con **97,36% de cobertura de líneas** y las cuatro métricas por encima del 80%. El [overview](docs/commits/003.md) registra resultados y límites.

## Integración continua

[El workflow de CI](.github/workflows/ci.yml) se ejecuta en GitHub Actions ante push o pull request: instala desde lockfile en Node 24, levanta un servicio PostgreSQL de pruebas, revisa formato, lint y tipos, compila y ejecuta pruebas con cobertura. Conserva el reporte como artefacto. Su ejecución remota requiere publicar los commits en GitHub; no se ha configurado despliegue todavía.

## Estructura actual

```text
src/
  config/environment.ts   # Validación de configuración
  config/runtime-environment.ts # Configuración HTTP y PostgreSQL
  database/               # Conexión, comandos y migración inicial
  users/entities/         # Usuario y rol persistidos
  products/entities/      # Producto y stock
  movements/entities/     # Historial con usuario y producto
  seed/                   # Credenciales, hash y carga transaccional
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

La siguiente fase implementará autenticación y 2FA con su propia especificación antes del código.

## Entrega final pendiente

La entrega deberá incluir código fuente, pruebas Jest y Supertest con cobertura mínima del 80%, colección y entorno Postman sin secretos, instrucciones completas, informe de endpoints y arquitectura, pipeline de pruebas y despliegue automatizado, URL del repositorio y URL de la API desplegada. El informe debe adjuntarse a la tarea de Intu.
