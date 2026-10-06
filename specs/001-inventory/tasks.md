# Tareas 001 — seguimiento

Fecha: 2026-10-06. Una marca completada corresponde a trabajo verificable, no a comportamiento futuro.

## Commit 1 — documentación

- [x] C1-01: identificar ejemplo y carpeta de trabajo; comprobar que el remoto indicado está vacío y clonarlo en la carpeta elegida.
- [x] C1-02: registrar la elección del usuario: inventario y archivos versionados de Spec-Driven Design.
- [x] C1-03: definir historias, reglas, contratos propuestos y criterios de aceptación.
- [x] C1-04: mapear todos los requisitos y porcentajes de la rúbrica.
- [x] C1-05: preparar alcance y validaciones de los commits 2 y 3.
- [x] C1-06: documentar decisiones, pendientes, flujo por commit y overview.
- [x] C1-07: verificar enlaces locales, rúbrica y whitespace; resultados registrados en el overview.
- [x] C1-08: registrar este incremento como primer commit local con los archivos documentales verificados.
- [x] C1-09: overview presentado; el usuario autorizó avanzar al segundo commit el 2026-10-06.

## Commit 2 — cerrado

- [x] C2-01: el usuario autorizó continuar sin cambios de alcance; documentos actualizados.
- [x] C2-02: bootstrap especificado en `specs/002-bootstrap`; versiones compatibles verificadas y fijadas.
- [x] C2-03: NestJS, configuración, validación y health implementados.
- [x] C2-04: Jest, Supertest, umbral de cobertura y CI inicial configurados.
- [x] C2-05: checks pasan; resultados y limitaciones registrados en `docs/commits/002.md`.
- [x] C2-06: registrar el segundo commit local.
- [x] C2-07: el usuario autorizó avanzar al commit 3 tras el overview, el 2026-10-06.

## Commit 3 — cerrado

- [x] C3-01: usuario autorizó continuar; especificación de persistencia/seed preparada.
- [x] C3-02: esquema, constraints, saldo almacenado y claves de seed definidos en el incremento 003.
- [x] C3-03: PostgreSQL, TypeORM, migración y aislamiento configurados y verificados.
- [x] C3-04: seed crea admin, operador y datos de inventario sin duplicar ni borrar registros existentes.
- [x] C3-05: migración, integridad, rollback, persistencia e idempotencia/concurrencia pasan en PostgreSQL; CI extendido.
- [x] C3-06: README, SDD y overview actualizados con resultados reales.
- [x] C3-07: registrar el tercer commit local.
- [x] C3-08: overview presentado; el usuario autorizó commit 4 y push el 2026-10-06.

## Commit 4 — autenticación

- [x] C4-01: usuario autoriza incremento y publicación; contratos y políticas en `specs/004-authentication` antes del código.
- [x] C4-02: JWT, TOTP cifrado, migración incremental y script de enrolamiento implementados.
- [x] C4-03: sesiones revocables, identidad, límites persistidos y guards reutilizables implementados.
- [x] C4-04: 126 pruebas, cobertura y checks finales verificados; evidencia en `docs/commits/004.md`.
- [x] C4-05: documentación actualizada; registrar este incremento como cuarto commit.
- [ ] C4-06: publicación posterior al commit; resultado de push/CI informado al cerrar y en el próximo incremento.
- [ ] C4-07: overview y recomendación al grupo presentados; revisión antes del siguiente incremento.

## Entrega completa — pendiente después de los tres commits

- [ ] F-01: autenticación JWT, enrolamiento y verificación TOTP, sesiones y logout revocable.
- [ ] F-02: roles, administración de usuarios y permisos por ruta.
- [ ] F-03: catálogo y existencias con validaciones y paginación.
- [ ] F-04: movimientos auditables, atomicidad y control de concurrencia.
- [ ] F-05: cobertura global mínima del 80% y pruebas HTTP sobre PostgreSQL real.
- [ ] F-06: colección y entorno Postman utilizables sin secretos reales.
- [ ] F-07: README reproducible e informe detallado con ejecución de pruebas.
- [ ] F-08: despliegue en nube, pipeline automatizado, URLs y evidencias.
- [ ] F-09: comprobar participación real mediante commits y preparar el informe para Intu.
