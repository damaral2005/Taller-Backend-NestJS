# Registro de decisiones

| ID   | Decisión                                                                              | Estado                                           | Motivo                                                                                                  |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| D-01 | Desarrollar en `Taller Backend – NestJS`; usar `2026-2-nestjs-postgres` como ejemplo. | Confirmada por contexto del usuario e inspección | La primera está vacía y la segunda contiene el ejemplo del curso.                                       |
| D-02 | Trabajar con `https://github.com/damaral2005/Taller-Backend-NestJS.git`.              | Confirmada por usuario                           | Es el repositorio de la entrega; inicialmente vacío.                                                    |
| D-03 | Elegir inventario y Spec-Driven Design con archivos versionados.                      | Confirmada por usuario                           | Respuesta del 2026-10-06; no se requiere instalar Spec Kit.                                             |
| D-04 | Cerrar y revisar un commit antes de implementar el siguiente.                         | Confirmada por usuario                           | Permite revisar cambios y mantener SDD actualizado.                                                     |
| D-05 | Productos, saldo y movimientos en un inventario; cantidades enteras.                  | Alcance inicial aceptado al avanzar              | Usuario autorizó el commit 2 tras el overview, sin cambios de alcance.                                  |
| D-06 | Roles `admin` y `operador`, usuarios creados por admin.                               | Alcance inicial aceptado al avanzar              | Cubre administración de roles y permisos distintos sin registro público.                                |
| D-07 | TOTP como 2FA y sesiones persistidas para revocar JWT.                                | Propuesta técnica                                | Cumple dos factores y logout verificable en el servidor.                                                |
| D-08 | PostgreSQL, TypeORM, migraciones y seed por script idempotente.                       | Plan técnico inicial                             | Satisface persistencia y evita una ruta pública de carga de datos.                                      |
| D-09 | Primeros commits: SDD, base NestJS, persistencia/seed.                                | Segundo commit autorizado                        | Cada cambio se puede validar por separado; seguridad y dominio siguen después.                          |
| D-10 | Node 24, npm 11 y TypeScript estricto con CommonJS.                                   | Resuelta para commit 2                           | Coincide con el runtime local y permite usar Jest según la rúbrica.                                     |
| D-11 | NestJS 12.1.2, Config 12.0.1, TypeScript 5.9.3, Jest 30.5.2 y ts-jest 29.4.14.        | Metadata y peer dependencies verificadas en npm  | Las versiones exactas se fijan en package.json y el lockfile. TypeORM se verifica en el commit 3.       |
| D-12 | Health solo comprueba el proceso HTTP; prefijo `/api/v1`.                             | Implementación del commit 2                      | Evita declarar disponibilidad de una base de datos aún no conectada.                                    |
| D-13 | Cobertura conjunta de unidades y HTTP, sin excluir archivos de arranque ni módulos.   | Configurada para commit 2                        | El umbral del 80% aplica a las cuatro métricas; las nuevas funcionalidades también se incluirán.        |
| D-14 | ESLint 10.12.0 y @eslint/js 10.0.1 con typescript-eslint 8.71.1.                      | Compatibilidad verificada en npm                 | ESLint 9 ya no tiene soporte; las versiones elegidas aceptan Node 24 y el analizador soporta ESLint 10. |

## Pendientes y momento de resolución

El código propio se compila a CommonJS; NestJS 12 distribuye dependencias ESM. Los scripts de pruebas habilitan las VM de módulos de Node para que Jest pueda cargarlas, según su documentación oficial. No se simula Nest ni se excluyen estas pruebas para resolver la compatibilidad.

| ID   | Decisión pendiente                                                                                                           | Resolver antes de                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| P-02 | Versiones compatibles de TypeORM y driver PostgreSQL; runtime y herramientas base resueltos en D-10/D-11.                    | Implementar commit 3                       |
| P-03 | Modelo exacto de datos, normalización de SKU/username y claves del seed.                                                     | Implementar commit 3                       |
| P-04 | Librería TOTP, parámetros, vigencia JWT/desafíos, límites de intentos, enrolamiento/recuperación y política de último admin. | Implementar autenticación y administración |
| P-05 | Campos exactos de DTOs, paginación y formato uniforme de errores.                                                            | Implementar cada ruta                      |
| P-06 | Integrantes y autoría de contribuciones reales.                                                                              | Revisar participación y preparar entrega   |
| P-07 | Proveedor de nube, base de datos, credenciales y estrategia de migración/despliegue.                                         | Implementar despliegue                     |

El ejemplo puede orientar la estructura modular y los DTOs; no demuestra cumplimiento de JWT, 2FA, roles, cobertura ni despliegue. No se reutilizan passwords, secretos o datos personales de otros entornos.
