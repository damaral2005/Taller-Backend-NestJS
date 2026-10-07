# Especificación 001 — API de inventario

Fecha: actualización 2026-10-07. Estado: bootstrap, persistencia, seed, autenticación y administración/autorización implementados y verificados en los incrementos 002 a 005. Rutas de inventario siguen pendientes.

## Objetivo y alcance

Construir una API REST de inventario con NestJS, PostgreSQL y TypeORM. El grupo eligió inventario y Spec-Driven Design con archivos versionados. El alcance inicial propuesto comprende productos, existencias y movimientos, en un único inventario y con cantidades enteras.

No se incluyen inicialmente ventas, facturación, proveedores, múltiples bodegas, imágenes ni interfaz gráfica. Si se incorporan, se actualizará esta especificación antes de implementarlos.

## Actores e historias

- **Admin:** inicia sesión con dos factores, administra usuarios y roles, mantiene el catálogo, consulta existencias e historial y registra movimientos.
- **Operador:** inicia sesión con dos factores, consulta productos y existencias y registra entradas y salidas; no administra usuarios ni modifica el catálogo.

| Historia                        | Resultado verificable                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| HU-01: preparar una instalación | Un script crea el usuario `admin` y datos de demostración sin duplicarlos al repetirse. |
| HU-02: acceder de forma segura  | Contraseña y segundo factor válidos permiten obtener un JWT de acceso.                  |
| HU-03: cerrar sesión            | El token de la sesión cerrada deja de permitir acceso a rutas protegidas.               |
| HU-04: administrar permisos     | Solo admin crea usuarios o asigna los roles permitidos.                                 |
| HU-05: mantener el catálogo     | Admin crea y actualiza productos con SKU único y los desactiva.                         |
| HU-06: controlar existencias    | Entradas y salidas actualizan el saldo y dejan un movimiento auditable.                 |
| HU-07: consultar inventario     | Usuarios autenticados consultan catálogo, saldo e historial paginado.                   |

## Reglas de negocio

- RN-01: cada producto tiene ID UUID, SKU único normalizado, nombre, descripción opcional, estado activo y fechas de creación/actualización.
- RN-02: un producto nuevo comienza con saldo cero. El saldo solo cambia por movimientos; no se permite editarlo directamente.
- RN-03: cada movimiento tiene ID, producto, tipo `IN` o `OUT`, cantidad entera positiva, motivo, usuario responsable y fecha. Los movimientos no se editan ni eliminan.
- RN-04: una salida no puede dejar saldo negativo. La validación, el cambio de saldo y el movimiento se ejecutan en una misma transacción, protegiendo el saldo también frente a peticiones concurrentes.
- RN-05: productos inactivos conservan su historial y no admiten nuevos movimientos.
- RN-06: una segunda ejecución del seed conserva los usuarios y movimientos existentes, no reinicia contraseñas ni borra datos de negocio.
- RN-07: los roles válidos son `admin` y `operador`; se validan en el servidor. Ninguna petición pública puede conceder privilegios.

## Autenticación y autorización

El incremento 004 implementa enrolamiento privado inicial, TOTP, desafíos, JWT con sesión, identidad, logout revocable y guards reutilizables. Políticas exactas en [la especificación 004](../004-authentication/spec.md). El incremento 005 implementa creación/listado de usuarios y asignación de roles exclusiva para admin, con políticas de último admin y revalidación transaccional según [su especificación](../005-users/spec.md). Recuperación de 2FA permanece pendiente.

- Usuarios creados por admin; no habrá registro público en el alcance inicial.
- Contraseñas almacenadas mediante hash. Contraseñas, hashes, semillas TOTP y secretos no aparecen en respuestas ordinarias ni en logs.
- Segundo factor: TOTP mediante aplicación autenticadora; librería, ventana temporal y parámetros definidos en la especificación 004.
- El alta entrega una credencial limitada de enrolamiento, con vencimiento y de un solo uso. Solo permite configurar y confirmar TOTP; no permite acceder a inventario ni administrar usuarios.
- `login` valida las credenciales y devuelve un desafío temporal de 2FA; el desafío no es un JWT de acceso. `verify-2fa` valida el código, consume el desafío y crea una sesión con JWT de acceso.
- Cada JWT de acceso identifica usuario y sesión; las rutas protegidas verifican expiración, sesión activa y rol vigente. Cambiar un rol afecta los permisos de las siguientes peticiones.
- `logout` revoca la sesión en PostgreSQL; su JWT se rechaza en las siguientes peticiones. No basta con borrar el token en Postman.
- Los secretos TOTP se almacenan cifrados con una clave externa a la base de datos. El enrolamiento del admin inicial se documentará sin versionar secretos reales.
- Se limitarán intentos de login y de 2FA; desafíos y códigos consumidos no pueden reutilizarse para crear otra sesión.
- Expiraciones y límites están definidos en 004; último admin registrado/enrolado se protege en 005. Recuperación de 2FA y rotación siguen pendientes para mantenimiento.

## Contratos HTTP previstos

Prefijo propuesto: `/api/v1`. Son contratos iniciales; DTOs completos, ejemplos de respuesta y límites de paginación se precisarán en la especificación del incremento que los implemente.

Actualmente health, seis rutas `/auth/*` y tres rutas `/users` de administración están disponibles. Persistencia/seed se verifican según 003; inventario sigue previsto. El primer enrolamiento se emite por script privado según 004; la creación administrativa entrega credencial limitada según 005.

| Método y ruta                | Acceso                          | Parámetros principales                    | Resultado esperado                                                                   |
| ---------------------------- | ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /health`                | Público                         | Ninguno                                   | `200`: proceso disponible; no garantiza conexión a BD.                               |
| `POST /auth/2fa/setup`       | Credencial de enrolamiento      | Token limitado                            | `201`: datos TOTP para el enrolamiento autorizado.                                   |
| `POST /auth/2fa/confirm`     | Credencial de enrolamiento      | Token limitado y código TOTP              | `200`: segundo factor activado.                                                      |
| `POST /auth/login`           | Público, con límite de intentos | `username`, `password`                    | `200`: desafío de 2FA; `401`: credenciales inválidas.                                |
| `POST /auth/verify-2fa`      | Desafío temporal                | `challengeToken`, `code`                  | `200`: JWT de acceso; `401`: desafío o código inválido.                              |
| `POST /auth/logout`          | Autenticado                     | Bearer JWT                                | `204`: sesión revocada.                                                              |
| `GET /auth/me`               | Autenticado                     | Bearer JWT                                | `200`: identidad y rol, sin secretos.                                                |
| `POST /users`                | Admin                           | `username`, `password`, `role`            | `201`: usuario y mecanismo de enrolamiento; `409`: username duplicado.               |
| `GET /users`                 | Admin                           | `page`, `limit`                           | `200`: usuarios paginados, sin secretos.                                             |
| `PATCH /users/:id/role`      | Admin                           | UUID, `role`                              | `200`: rol actualizado; `404`: usuario inexistente.                                  |
| `POST /products`             | Admin                           | `sku`, `name`, `description?`             | `201`: producto con saldo cero; `409`: SKU duplicado.                                |
| `GET /products`              | Autenticado                     | `page`, `limit`, `search?`, `active?`     | `200`: catálogo paginado con existencias.                                            |
| `GET /products/:id`          | Autenticado                     | UUID                                      | `200`: producto y saldo; `404`: producto inexistente.                                |
| `PATCH /products/:id`        | Admin                           | UUID y campos de catálogo opcionales      | `200`: producto actualizado; no admite cambios de saldo.                             |
| `PATCH /products/:id/status` | Admin                           | UUID, `active`                            | `200`: producto activado o desactivado.                                              |
| `POST /movements`            | Admin u operador                | `productId`, `type`, `quantity`, `reason` | `201`: movimiento y saldo resultante; `409`: saldo insuficiente o producto inactivo. |
| `GET /movements`             | Autenticado                     | `page`, `limit`, `productId?`, `type?`    | `200`: historial paginado con responsable y fecha.                                   |

Las rutas de la tabla son relativas al prefijo. `400` corresponde a parámetros inválidos o campos no permitidos, `401` a autenticación ausente/expirada/revocada y `403` a permisos insuficientes. Nunca se expone información interna de PostgreSQL en un error HTTP.

## Trazabilidad de la rúbrica

| ID   | Requisito                 | Peso | Criterio de aceptación y evidencia final                                                                                                                | Estado                                                                                  |
| ---- | ------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| R-01 | Seed                      | 5%   | Script documentado crea `admin`, al menos un operador, productos y movimientos válidos; dos ejecuciones no duplican ni borran datos.                    | Implementado y verificado en commit 3                                                   |
| R-02 | Autenticación JWT y 2FA   | 5%   | Login exige ambos factores; JWT protege rutas; logout revoca acceso; pruebas de fallos, expiración y reutilización.                                     | Implementado y verificado en commit 4; recuperación 2FA pendiente                       |
| R-03 | Autorización              | 5%   | Admin y operador tienen permisos distintos; solo admin asigna roles; pruebas HTTP de `401`/`403` y cambio de rol.                                       | Implementado y verificado en 005: administración exclusiva para admin y roles vigentes  |
| R-04 | Pruebas                   | 25%  | Jest y Supertest con BD de prueba PostgreSQL real; cobertura global mínima del 80% en líneas, sentencias, funciones y ramas, verificada en CI.          | 184 pruebas y cobertura local en 005; CI success de 004; ejecución remota 005 tras push |
| R-05 | Persistencia              | 10%  | TypeORM guarda datos en PostgreSQL; migraciones reproducibles; constraints y transacciones probadas; datos sobreviven al reinicio.                      | Implementado y verificado en commit 3                                                   |
| R-06 | Funcionalidades y Postman | 25%  | Catálogo, saldos y movimientos cumplen RN-01 a RN-07; colección JSON y entorno permiten recorrer casos exitosos y errores.                              | Pendiente                                                                               |
| R-07 | Informe                   | 10%  | Documenta cada endpoint, parámetros, respuestas, autenticación, autorización, persistencia y ejecución de pruebas con resultados reales.                | Pendiente                                                                               |
| R-08 | Despliegue                | 15%  | API accesible en nube; pipeline ejecuta checks, pruebas y despliegue automatizado con migraciones; se aporta URL y evidencia de una ejecución correcta. | CI con PostgreSQL preparado; despliegue pendiente                                       |

Entrega transversal: README reproducible, URL del repositorio, URL de API, informe para Intu y commits que permitan verificar la participación del grupo. La suma de pesos es 100%.

## Escenarios mínimos de aceptación

1. Seed en una BD vacía → admin y datos válidos; repetirlo → sin duplicados, borrados ni alteración de credenciales existentes.
2. Contraseña correcta sin 2FA → no permite consultar inventario; 2FA correcto → sí permite; desafío expirado o consumido → `401`.
3. JWT válido → acceso; JWT expirado, alterado o de sesión cerrada → `401`.
4. Operador intenta asignar roles o crear un producto → `403`; admin → permitido.
5. Crear dos productos con el mismo SKU normalizado → el segundo devuelve `409`.
6. Entrada de 10 y salida de 4 → saldo 6 y dos movimientos con responsable.
7. Salida de 7 con saldo 6 → `409`, mismo saldo y sin movimiento nuevo.
8. Dos salidas simultáneas de 4 con saldo 6 → solo una tiene éxito, saldo 2 y un único movimiento nuevo.
9. Movimiento con cantidad cero, negativa o decimal → `400`; UUID inválido → `400`.
10. Producto inactivo → rechaza movimientos y conserva su historial.
11. Reiniciar la API → persisten productos, saldos, movimientos y revocaciones.
12. CI con cobertura por debajo del umbral o una prueba fallida → no despliega.

El commit 1 verifica documentación; el 2 base/health; el 3 persistencia/seed; el 4 autenticación; el 5 administración de usuarios/roles, último admin y revalidación/concurrencia. Permisos y operaciones de inventario se aplicarán al implementar sus rutas; recuperación 2FA y despliegue siguen pendientes.

Estimación de bloques completos sobre el código vigente: R-01 (5) + R-02 (5) + R-03 (5) + R-04 (25) + R-05 (10) = 50%. No garantiza la nota del docente; al ampliar dominio debe mantenerse cobertura y completar R-06/R-07/R-08.
