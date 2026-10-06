# Registro de decisiones

| ID | Decisión | Estado | Motivo |
| --- | --- | --- | --- |
| D-01 | Desarrollar en `Taller Backend – NestJS`; usar `2026-2-nestjs-postgres` como ejemplo. | Confirmada por contexto del usuario e inspección | La primera está vacía y la segunda contiene el ejemplo del curso. |
| D-02 | Trabajar con `https://github.com/damaral2005/Taller-Backend-NestJS.git`. | Confirmada por usuario | Es el repositorio de la entrega; inicialmente vacío. |
| D-03 | Elegir inventario y Spec-Driven Design con archivos versionados. | Confirmada por usuario | Respuesta del 2026-10-06; no se requiere instalar Spec Kit. |
| D-04 | Cerrar y revisar un commit antes de implementar el siguiente. | Confirmada por usuario | Permite revisar cambios y mantener SDD actualizado. |
| D-05 | Productos, saldo y movimientos en un inventario; cantidades enteras. | Propuesta inicial para revisar | Alcance manejable con reglas transaccionales verificables. |
| D-06 | Roles `admin` y `operador`, usuarios creados por admin. | Propuesta inicial para revisar | Cubre administración de roles y permisos distintos sin registro público. |
| D-07 | TOTP como 2FA y sesiones persistidas para revocar JWT. | Propuesta técnica | Cumple dos factores y logout verificable en el servidor. |
| D-08 | PostgreSQL, TypeORM, migraciones y seed por script idempotente. | Plan técnico inicial | Satisface persistencia y evita una ruta pública de carga de datos. |
| D-09 | Primeros commits: SDD, base NestJS, persistencia/seed. | Plan propuesto para revisar | Cada cambio se puede validar por separado; seguridad y dominio siguen después. |

## Pendientes y momento de resolución

| ID | Decisión pendiente | Resolver antes de |
| --- | --- | --- |
| P-01 | Confirmar alcance, cantidades enteras y permisos propuestos; incorporar feedback. | Commit 2 |
| P-02 | Runtime Node/npm y versiones compatibles de NestJS, TypeORM y herramientas de prueba. | Implementar commit 2 |
| P-03 | Modelo exacto de datos, normalización de SKU/username y claves del seed. | Implementar commit 3 |
| P-04 | Librería TOTP, parámetros, vigencia JWT/desafíos, límites de intentos, enrolamiento/recuperación y política de último admin. | Implementar autenticación y administración |
| P-05 | Campos exactos de DTOs, paginación y formato uniforme de errores. | Implementar cada ruta |
| P-06 | Integrantes y autoría de contribuciones reales. | Revisar participación y preparar entrega |
| P-07 | Proveedor de nube, base de datos, credenciales y estrategia de migración/despliegue. | Implementar despliegue |

El ejemplo puede orientar la estructura modular y los DTOs; no demuestra cumplimiento de JWT, 2FA, roles, cobertura ni despliegue. No se reutilizan passwords, secretos o datos personales de otros entornos.
