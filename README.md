# SubastaYa

Plataforma web de subastas en tiempo real con billetera virtual, escrow, anti-sniping y gestión transaccional segura.

## Estructura

- `backend/`: API REST (Node.js + Express + TypeORM), lógica de negocio, WebSockets y worker de cierre de subastas.
- `frontend/`: interfaz web (HTML/CSS/JS vanilla), servida como estática desde el propio backend.

## Instalación rápida

```
git clone https://github.com/Julian-Iglesias/subasta-ya.git
cd subasta-ya/backend
npm install
```
Crear `.env` (a partir de `.env.example`) con los datos de tu MySQL local, crear la base `subastaya` vacía, y luego:
```
npx typeorm migration:run -d src/config/database.js
node src/scripts/seed.js
npm start
```
La app queda en `http://localhost:3000`.

## Funcionalidades

- **Catálogo**: exploración de subastas con filtros por estado, categoría y ordenamiento.
- **Publicación de subastas**: formulario de alta con validaciones de fechas y montos.
- **Sala de subasta en vivo**: temporizador, historial de ofertas y consola de puja, sincronizados en tiempo real vía **WebSockets (Socket.io)**.
- **Billetera virtual**: saldo total, retenido y disponible, carga de saldo simulada e historial de movimientos.
- **Mis actividades**: pujas/compras realizadas y publicaciones propias.

## Reglas de negocio

- **Escrow**: al pujar, el monto queda retenido; si otro usuario supera la oferta, se libera automáticamente el saldo del postor anterior.
- **Anti-sniping**: una puja dentro de los últimos 60 segundos extiende la subasta 2 minutos.
- **Optimistic locking**: `Wallet` y `Auction` usan un campo `version`; una actualización concurrente desactualizada se rechaza con `409 Conflict` en vez de sobrescribir datos.
- **Worker de cierre**: cada 30 segundos liquida subastas vencidas con ganador (transfiere el saldo del comprador al vendedor) o las marca `DESIERTA` si no tuvieron ofertas.
- **AuditLog**: registra pujas, rechazos por concurrencia, extensiones por anti-sniping, cambios de estado y acreditaciones manuales de saldo.

## Prueba de concurrencia

`backend/scripts/concurrency-test.js` envía dos pujas simultáneas a la misma subasta para comprobar que solo una se acepta (`201`) y la otra se rechaza por conflicto de versión (`409`):
```
node backend/scripts/concurrency-test.js
```
