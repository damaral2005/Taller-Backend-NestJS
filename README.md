# Taller Backend NestJS — API de inventario

Backend académico para administrar productos, existencias y movimientos de inventario con NestJS y PostgreSQL. El proyecto se desarrolla mediante **Spec-Driven Design con archivos versionados**: especificar, planificar, implementar, verificar y actualizar la documentación en cada commit.

Repositorio: [Taller-Backend-NestJS](https://github.com/damaral2005/Taller-Backend-NestJS).

## Estado actual

El commit 1 establece la especificación y el plan inicial. **Todavía no hay una aplicación ejecutable, endpoints, dependencias instaladas ni despliegue.** Los contratos y comportamientos documentados representan lo que se implementará; no son funcionalidades ya disponibles.

La carpeta `2026-2-nestjs-postgres` se utiliza como referencia del curso. El desarrollo propio se realiza en `Taller Backend – NestJS`; no se modifica el ejemplo ni se copia su historial.

## Documentación

- [Especificación: alcance, reglas, endpoints previstos y rúbrica](specs/001-inventory/spec.md).
- [Plan técnico y alcance de los primeros tres commits](specs/001-inventory/plan.md).
- [Tareas y estado de avance](specs/001-inventory/tasks.md).
- [Decisiones y asuntos pendientes](docs/decisions.md).
- [Overview y verificación del commit 1](docs/commits/001.md).

## Flujo de trabajo por commit

1. Revisar la especificación, las decisiones y la tarea que corresponde.
2. Actualizar primero los criterios de aceptación si cambia el comportamiento previsto.
3. Implementar únicamente el alcance del commit actual.
4. Ejecutar las comprobaciones aplicables y registrar los resultados reales.
5. Actualizar especificación, plan, tareas y overview antes de cerrar el commit.
6. Revisar con el grupo el overview antes de iniciar el siguiente commit.

Los cambios de alcance se registran; una tarea pendiente no se presenta como completada. Los commits deben reflejar las contribuciones reales de cada integrante, sin atribuir trabajo a otras personas.

## Primeros tres commits

| Commit | Alcance | Estado |
| --- | --- | --- |
| 1 | Especificación de inventario, rúbrica y flujo de trabajo | Commit local; pendiente de revisión conjunta del [overview](docs/commits/001.md) |
| 2 | Base NestJS, configuración, validación, health y pruebas iniciales | Pendiente de revisión del commit 1 |
| 3 | PostgreSQL, migración inicial, seed y pruebas de persistencia | Pendiente de revisión del commit 2 |

JWT con 2FA, permisos, operaciones completas de inventario, colección Postman, informe y despliegue se desarrollarán en incrementos posteriores. Estos tres commits iniciales no completan la entrega.

## Ejecución y pruebas

Los comandos reproducibles de instalación, configuración y ejecución se incorporarán con la base NestJS en el commit 2. En el commit 3 se documentará el arranque de PostgreSQL, las migraciones y el seed. Cada incremento incluirá instrucciones para probar lo que realmente implemente.

## Entrega final pendiente

La entrega deberá incluir código fuente, pruebas Jest y Supertest con cobertura mínima del 80%, colección y entorno Postman sin secretos, instrucciones completas, informe de endpoints y arquitectura, pipeline de pruebas y despliegue automatizado, URL del repositorio y URL de la API desplegada. El informe debe adjuntarse a la tarea de Intu.
