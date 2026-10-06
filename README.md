# Taller Backend NestJS — API de inventario

Backend académico para administrar productos, existencias y movimientos de inventario con NestJS y PostgreSQL. El proyecto se desarrolla mediante **Spec-Driven Design con archivos versionados**: especificar, planificar, implementar, verificar y actualizar la documentación en cada commit.

Repositorio: [Taller-Backend-NestJS](https://github.com/damaral2005/Taller-Backend-NestJS).

## Estado actual

El commit 1 establece la especificación y el plan inicial. El commit 2 incorpora la base ejecutable de NestJS, configuración validada, `GET /api/v1/health`, pruebas iniciales y un pipeline de CI. **Todavía no hay PostgreSQL, seed, autenticación, usuarios, rutas de inventario ni despliegue.**

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
| 3      | PostgreSQL, migración inicial, seed y pruebas de persistencia      | Pendiente de revisión del commit 2                            |

JWT con 2FA, permisos, operaciones completas de inventario, colección Postman, informe y despliegue se desarrollarán en incrementos posteriores. Estos tres commits iniciales no completan la entrega.

## Requisitos y ejecución

- Node.js **24**, versión 24.15.0 o superior dentro de esa versión mayor (`.nvmrc`).
- npm **11**.
- No se necesita PostgreSQL en este incremento.

Desde la raíz del repositorio:

```bash
npm ci
```

Crear la configuración local en PowerShell:

```powershell
Copy-Item .env.example .env
```

En Bash se puede usar `cp .env.example .env`. El archivo `.env` no se versiona; copiarlo es opcional porque las variables actuales tienen valores por defecto.

| Variable   | Por defecto   | Regla                                            |
| ---------- | ------------- | ------------------------------------------------ |
| `NODE_ENV` | `development` | `development`, `test` o `production`             |
| `PORT`     | `3000`        | Entero entre 1 y 65535, escrito solo con dígitos |

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
| `npm test`                            | Unidades Jest de configuración                               |
| `npm run test:e2e`                    | Pruebas HTTP Supertest, pipe global y listener real          |
| `npm run test:cov`                    | Ambas suites y cobertura conjunta con umbral mínimo del 80%  |
| `npm run format` / `npm run lint:fix` | Corrección manual de formato / lint                          |

La cobertura incluye todos los archivos de `src` salvo tests y se exige en líneas, sentencias, funciones y ramas. El reporte se escribe en `coverage/`; se puede consultar `coverage/lcov-report/index.html` y `coverage/coverage-summary.json`. Los resultados medidos de este incremento se registran en su overview y no representan todavía cobertura del dominio completo.

Las pruebas HTTP cierran sus servidores al terminar y usan puertos efímeros para verificar el listener. El controlador de validación existe únicamente en `test/` y no se distribuye con la API.

Los scripts ya habilitan las VM de módulos de Node para que Jest cargue las dependencias ESM de NestJS 12; no es necesario añadir flags manualmente. En este incremento pasan **36 pruebas** y la cobertura de líneas es **89,36%**, con las cuatro métricas por encima del 80%.

## Integración continua

[El workflow de CI](.github/workflows/ci.yml) se ejecuta en GitHub Actions ante push o pull request: instala desde lockfile en Node 24, revisa formato, lint y tipos, compila y ejecuta pruebas con cobertura. Conserva el reporte como artefacto. Su ejecución remota requiere publicar los commits en GitHub; no se ha configurado despliegue todavía.

## Estructura actual

```text
src/
  config/environment.ts   # Validación de configuración
  health/                 # Endpoint público de salud
  app.module.ts           # Configuración global y módulos
  configure-app.ts        # Prefijo, pipe y hooks compartidos
  bootstrap.ts            # Creación y arranque del servidor
  main.ts                 # Punto de entrada del proceso
test/                     # Unidades e integración HTTP
specs/                    # Especificaciones, planes y tareas versionadas
docs/                     # Decisiones y overview por commit
.github/workflows/ci.yml   # Checks automatizados
```

El commit 3 añadirá instrucciones de PostgreSQL, migraciones, seed y pruebas reales de persistencia.

## Entrega final pendiente

La entrega deberá incluir código fuente, pruebas Jest y Supertest con cobertura mínima del 80%, colección y entorno Postman sin secretos, instrucciones completas, informe de endpoints y arquitectura, pipeline de pruebas y despliegue automatizado, URL del repositorio y URL de la API desplegada. El informe debe adjuntarse a la tarea de Intu.
