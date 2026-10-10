# Tareas 007 — autenticación solo con JWT

- [ ] J-T01: grupo aprueba spec/plan/tareas, resuelve D-A a D-D y contrasta R-02 con el enunciado.
- [ ] J-T02: decisiones D-37 en adelante registradas; 001, 004 y 005 actualizadas o marcadas como reemplazadas.
- [ ] J-T03: migración nueva y entidades sin estructura TOTP; verificada sobre una BD con datos del esquema anterior.
- [ ] J-T04: login directo con sesión y JWT; rutas 2FA retiradas (404); sin cifrado ni `otpauth`.
- [ ] J-T05: creación de usuarios sin enrolamiento y regla de último admin simplificada.
- [ ] J-T06: script `auth:enroll`, `TOTP_ENCRYPTION_KEY`, DTOs y código muerto eliminados; `.env` antiguo no falla.
- [ ] J-T07: pruebas de auth, users, products, migración y configuración reescritas y en verde.
- [ ] J-T08: formato, lint, tipos, build y cobertura >=80% en las cuatro métricas; proceso compilado y búsqueda de referencias residuales.
- [ ] J-T09: README, decisiones, trazabilidad, tareas y `docs/commits/007.md` actualizados.
- [ ] J-T10: commit con identidad real, push/PR y CI verificado.
- [ ] J-T11: overview presentado y revisado antes del siguiente incremento.
