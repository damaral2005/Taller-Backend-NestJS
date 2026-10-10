# Plan 001 — implementación incremental

Fecha: actualización 2026-10-07. Estado: commits 1 a 4 cerrados/publicados; CI de 004 exitoso. Usuario autoriza commit 5 de administración/autorización y push al finalizar.

## Arquitectura prevista

- API modular NestJS en TypeScript: `health`, `auth`, `users`, `products`, `movements` y `database`.
- PostgreSQL con TypeORM y migraciones versionadas; `synchronize` desactivado. Las versiones compatibles se verificarán al crear el proyecto y se fijarán con lockfile.
- Configuración validada al arranque, `.env.example` sin secretos, prefijo `/api/v1` y validación de DTOs que rechace campos no permitidos.
- Entidades previstas: `User`, `Session`, `TwoFactorChallenge`, `EnrollmentToken`, `Product` y `StockMovement`. Nombres y columnas se concretan en el diseño de cada incremento.
- FKs y constraints protegen integridad. Producto y movimiento se actualizan en una transacción con bloqueo de la fila del producto para prevenir saldo negativo concurrente.
- JWT de acceso asociado a una sesión persistida y TOTP como segundo factor. Guards verifican sesión y rol vigente; claves externas protegen secretos.
- Seed mediante script, sin endpoint público de carga. Emplea claves únicas y una transacción; no borra tablas ni altera usuarios existentes.
- Jest para unidades; Supertest con la aplicación NestJS para HTTP. Integración de persistencia contra PostgreSQL aislado, sin sustituirlo por SQLite.

## Commit 1 — especificación y organización

Mensaje previsto: `docs: define inventory specification and commit workflow`.

Incluye README, `.gitignore`, especificación con historias/reglas/rúbrica, este plan, tareas, decisiones y overview. Confirma carpeta de trabajo y remoto. No instala dependencias ni implementa endpoints.

Aceptación: todos los requisitos suministrados tienen criterio de aceptación; se distingue claramente entre previsto e implementado; los enlaces locales son válidos; el ejemplo no se modifica; solo se versionan archivos propios del primer incremento.

Validación: revisión documental, comprobación de enlaces, suma de porcentajes y `git diff --check`. No corresponde ejecutar Jest porque aún no hay código ni runner.

## Commit 2 — base NestJS verificable

Mensaje propuesto: `feat: bootstrap NestJS API with health checks and tests`.

Especificación incorporada: `specs/002-bootstrap/{spec,plan,tasks}.md`, con contrato exacto de health, configuración y criterios de prueba. Runtime: Node 24 y npm 11; versiones compatibles verificadas contra metadata npm y fijadas en el proyecto.

Incluye:

- Configuración NestJS/TypeScript y dependencias con lockfile.
- Arranque con puerto configurable, validación de configuración, prefijo y validación de DTOs comunes.
- `GET /api/v1/health` que informa disponibilidad del proceso, sin declarar disponibilidad de BD.
- Jest/Supertest y umbral de cobertura del 80%; el código fuente se incluye aunque no tenga pruebas. Solo configuración declarativa puede excluirse con justificación registrada.
- CI inicial de instalación reproducible, lint sin modificar archivos, build, pruebas y cobertura. PostgreSQL y despliegue se añaden cuando se implementen.
- README con comandos que se hayan ejecutado y resultados registrados en `docs/commits/002.md`.

Aceptación: instalación desde lockfile, lint, build, unidades, pruebas HTTP y cobertura pasan; health responde según su contrato; configuración inválida falla con mensaje claro sin secretos.

## Commit 3 — PostgreSQL y seed inicial

Mensaje propuesto: `feat: add PostgreSQL migrations and initial inventory seed`.

Especificación incorporada antes del código: `specs/003-persistence/{spec,plan,tasks}.md`, con esquema, constraints, transacciones, variables, aislamiento de pruebas y contrato del seed. Resultados registrados en `docs/commits/003.md`.

Incluye:

- PostgreSQL local reproducible con Docker Compose y configuración separada para pruebas.
- TypeORM con migración de usuarios, productos y movimientos; esquema preparado para roles y hash de contraseña. Las tablas de autenticación se agregan en su incremento.
- Stock derivado o almacenado con actualización transaccional: concretar una estrategia antes de crear el esquema. Propuesta: saldo almacenado en producto y movimiento asociado en la misma transacción.
- Seed crea `admin` y operador con contraseñas tomadas del entorno y hash; productos con SKU estable y movimientos de demostración identificables para garantizar idempotencia.
- Seed no habilita acceso sin 2FA; el enrolamiento y login solo estarán disponibles al completar autenticación.
- Pruebas con PostgreSQL real de migración, integridad, rollback e idempotencia; CI con servicio PostgreSQL.
- Documentación de migraciones, seed y pruebas; overview con limitaciones reales.

Aceptación: migración levanta esquema desde cero; seed se ejecuta dos veces sin duplicar, borrar o reiniciar credenciales; persistencia y constraints se prueban contra PostgreSQL; checks del commit 2 siguen pasando.

El commit 3 no implementa todavía las rutas completas de inventario ni demuestra el escenario de salidas HTTP concurrentes; esa evidencia corresponde al incremento de movimientos.

## Commit 4 — autenticación JWT y TOTP

Mensaje: `feat: add JWT authentication with TOTP and revocable sessions`.

Contratos, políticas, arquitectura y tareas previos al código en `specs/004-authentication/{spec,plan,tasks}.md`. Enrolamiento privado, setup/confirmación, desafíos limitados, códigos sin replay, JWT de 15 minutos, sesión persistida, identidad y logout revocable. Secretos TOTP cifrados con AES-256-GCM; límites de cuenta y pruebas persistidos. Guards JWT y roles reutilizables. Resultados y límites en `docs/commits/004.md`.

Aceptación: flujo completo y errores con Supertest/PostgreSQL real; concurrencia, expiración, intentos, revocación y rol vigente; cobertura global >=80% sin excluir código. Crear commit y verificar push autorizado. Administración de usuarios, recuperación 2FA y dominio permanecen para los siguientes incrementos.

## Commit 5 — administración y autorización

Mensaje previsto: `feat: add admin user management and role authorization`.

Contratos, políticas y tareas previos al código en `specs/005-users/{spec,plan,tasks}.md`. Crear usuarios y enrolamiento de forma atómica, listado paginado, asignación de roles exclusiva para admin, protección de último admin registrado/enrolado y revalidación transaccional. Sin migración ni nuevas dependencias. Resultados y limitaciones en `docs/commits/005.md`.

Aceptación: rutas reales con `401`/`403`, DTOs/duplicados/paginación, cambio vigente de permisos, concurrencia/rollback y cuenta/sesión modificadas mientras esperan. Pruebas Jest/Supertest/PostgreSQL y todas las métricas >=80%; documentación y overview antes del commit; push y CI después. R-03 queda completo solo tras verificar estos criterios.

## Commit 6 — catálogo de productos

Mensaje previsto: `feat: add product catalog endpoints`.

Contratos, validaciones, concurrencia y criterios P-01 a P-09 previos al código en `specs/006-catalog/{spec,plan,tasks}.md`. Cinco rutas `/products` (lectura para usuarios autenticados, escritura solo admin), SKU canónico e inmutable, saldo de solo lectura, edición con bloqueo de fila sin escribir `stock`. Sin migración ni dependencias nuevas. Resultados y límites en `docs/commits/006.md`.

Aceptación: rutas reales con `401`/`403`, DTOs, SKU duplicado (secuencial y concurrente), filtros y paginación, idempotencia y saldo intacto; pruebas Jest/Supertest/PostgreSQL y las cuatro métricas >=80%. R-06 queda parcial hasta tener movimientos y Postman.

## Commit 7 — retiro del 2FA

Mensaje previsto: `fix: remove two-factor authentication and keep JWT-only login`.

Contratos, decisiones y criterios J-01 a J-11 previos al código en `specs/007-jwt-only-auth/{spec,plan,tasks}.md`. Login directo con sesión y JWT, rutas 2FA retiradas, migración incremental que elimina estructura TOTP, creación de usuarios sin enrolamiento y regla de último admin simplificada. Resultados y límites en `docs/commits/007.md`.

## Incrementos posteriores

| Incremento   | Alcance y evidencias                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Recuperación | Definir y probar recuperación de 2FA con identidad verificada, sin bypass por contraseña.                                             |
| Movimientos  | Entradas/salidas transaccionales, consulta del historial y pruebas de concurrencia y rollback.                                        |
| Entrega      | Postman, informe, README completo, cobertura final y trazabilidad de todos los criterios.                                             |
| Despliegue   | Elegir proveedor, crear configuración reproducible, aplicar migraciones, completar pipeline automatizado y registrar URLs/evidencias. |

Cada incremento necesita especificación, plan y tareas antes del código y un overview al cerrarse. No se presume que los tres primeros commits satisfagan toda la rúbrica.

## Riesgos y comprobaciones

- El ejemplo no se toma como una solución completa: su login aún no emite JWT ni implementa 2FA y su seed elimina estudiantes antes de cargarlos. Adoptar esos comportamientos impediría cumplir los criterios propios.
- Las credenciales se suministran por entorno; nunca se versionan claves ni passwords reales en fixtures, Postman o informe.
- La BD de integración debe estar separada de desarrollo y producción. Los comandos de limpieza de pruebas deben rechazar una configuración que no identifique explícitamente la BD de pruebas.
- Los tests no ocultan módulos sin cobertura. El informe registra comandos, entorno, fecha y valores reales de cobertura.
- El despliegue requiere proveedor y acceso configurados; no se registra una URL ficticia ni se marca completado antes de verificarlo.
