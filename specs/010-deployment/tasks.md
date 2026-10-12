# Tareas 010 — despliegue en nube y pipeline

Una marca completada corresponde a trabajo verificado, no a comportamiento previsto.

## SDD

- [x] DP-T01: spec, plan y tareas escritos antes del código, con criterios DP-01 a DP-09 y decisiones propuestas D-51 a D-58.
- [x] DP-T02: usuario aprueba D-51 a D-58 el 2026-10-12 (despliegue solo desde `main`); registradas en `docs/decisions.md`, P-07 cerrada.

## Railway y GitHub (manual)

- [x] DP-T03: cuenta verificada, proyecto con servicios `Postgres` y `api`, configuración de build/pre-deploy/start/healthcheck según el plan; autodeploy desde GitHub desactivado.
- [x] DP-T04: variables de producción definidas (con `JWT_SECRET` nuevo y `TRUST_PROXY_HOPS=1`), dominio público generado en el puerto 8080 con `PORT=8080`. Configurado por el usuario el 2026-10-12; se comprueba en el primer despliegue.
- [x] DP-T05: project token creado; secreto `RAILWAY_TOKEN`, variables `RAILWAY_SERVICE` y `API_URL` y environment `production` configurados en GitHub.

## Código

- [x] DP-T06: `TRUST_PROXY_HOPS` validada y aplicada en `configureApplication`; 14 casos de unidad y 4 de Supertest con PostgreSQL (DP-07). La prueba principal falla si se quita el ajuste.
- [x] DP-T07: `.env.example` sin `JWT_SECRET` ni `TOTP_ENCRYPTION_KEY`, con `TRUST_PROXY_HOPS=0`; README con la variable y la sección de despliegue (DP-08).
- [x] DP-T08: `@railway/cli` 5.63.1 fijada; job `deploy` con `needs: verify`, solo en push a `main`, environment `production` y smoke test; workflow validado con actionlint (DP-01 a DP-03 pendientes de ejecución real).
- [x] DP-T09: formato, lint, tipos y build correctos; 468 pruebas en 19 suites con PostgreSQL 16 y Node 24.21.0; cobertura 98,53% sentencias, 94,69% ramas, 99,12% funciones y 98,93% líneas (DP-09). Simulacro compilado con `NODE_ENV=production`: migraciones repetidas sin cambios, seed, health/docs `200`, `401` sin token, `200` con token y límite por IP separado con `TRUST_PROXY_HOPS=1`.

## Publicación y evidencia

- [ ] DP-T10: commit con identidad real y push de `feat-despliegue`; run de la rama con `verify` en verde y sin `deploy` (DP-02).
- [ ] DP-T11: pull request revisado y merge a `main`; run `verify → deploy → smoke` exitoso (DP-01, DP-04).
- [ ] DP-T12: seed manual ejecutado una vez con contraseñas de producción propias, sin registrarlas.
- [ ] DP-T13: recorrido en producción (login, `401`, `403`, catálogo, movimiento) y persistencia tras un redeploy (DP-05, DP-06).
- [ ] DP-T14: evidencia de que un `verify` fallido no despliega (DP-03).

## Cierre

- [ ] DP-T15: README (URL de API y Swagger, sección de despliegue), trazabilidad R-08, decisiones y `docs/commits/010.md` actualizados con URL, run, fecha y límites.
- [ ] DP-T16: presentar overview y revisión del grupo antes del informe final.
