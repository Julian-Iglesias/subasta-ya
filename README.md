# SubastaYa

Plataforma web de subastas en tiempo real con billetera virtual, escrow, anti-sniping, autenticación JWT y control de concurrencia.

## Tecnologías

### Backend
- Node.js
- Express
- TypeORM
- MySQL
- bcryptjs
- JWT
- Socket.io
- dotenv

### Frontend
- HTML
- CSS
- JavaScript

## Estructura

```text
subasta-ya/
├── backend/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── entities/
│   │   ├── middlewares/
│   │   ├── migrations/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── seeds/
│   │   └── services/
│   └── package.json
├── frontend/
└── README.md
```

## Instalación

git clone https://github.com/Julian-Iglesias/subasta-ya.git
cd subasta-ya/backend
npm install

### Crear una base MySQL llamada:

subastaya

### Crear .env tomando como referencia .env.example:

PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=subastaya

JWT_SECRET=
JWT_EXPIRES_IN=1h

### Ejecutar migraciones:
```bash
npx typeorm migration:run -d src/config/database.js
```

### Cargar datos iniciales:
```bash
npm run seed
```

### La aplicación queda disponible en:

http://localhost:3000

## Funcionalidades

- Registro e inicio de sesión.
- Autenticación mediante JWT.
- Catálogo de subastas.
- Filtros por estado, categoría y rango de precio.
- Creación de subastas.
- Sala de subasta en tiempo real.
- Historial de pujas.
- Billetera virtual.
- Saldo total, retenido y disponible.
- Historial de movimientos.
- Actividades del usuario.
- Actualizaciones en tiempo real con Socket.io.

## Estados de subasta

UPCOMING
ACTIVE
FINALIZED
DESERTED

Las subastas pasan automáticamente de UPCOMING a ACTIVE.

### Al finalizar:

con ganador > FINALIZED
sin ofertas > DESERTED

## Escrow

Cuando un usuario realiza la oferta líder, el dinero queda retenido.

Ejemplo:
Saldo total: $100.000
Saldo retenido: $80.000
Saldo disponible: $20.000

Si otro usuario supera la oferta, el saldo retenido del postor anterior se libera automáticamente.

## Anti-sniping

Si se realiza una puja válida durante los últimos 60 segundos, la subasta se extiende 2 minutos.

## Concurrencia

El sistema utiliza optimistic locking mediante un campo version en entidades críticas como Auction y Wallet.

### Prueba de concurrencia requerida

Se prueba el caso en el que dos usuarios distintos realizan una puja al mismo tiempo sobre la misma subasta.

El objetivo es evitar que ambas pujas se guarden cuando parten de la misma versión de la subasta.

Resultado esperado:

```text
Usuario A → 201 Created
Usuario B → 409 Conflict
```

Solo una de las dos pujas debe quedar registrada.

La otra se rechaza con 409 Conflict porque la subasta ya fue modificada por otra operación concurrente.

## Auditoría

Las operaciones críticas quedan registradas en AuditLog.

Ejemplos:
BID_PLACED
BID_REJECTED
BID_REJECTED_CONCURRENCY
ANTI_SNIPING_EXTENDED
AUCTION_ACTIVATED
AUCTION_FINALIZED
AUCTION_DESERTED
WALLET_DEPOSIT

## Principales endpoints

### Autenticación
POST /api/auth/login
GET /api/auth/me

### Subastas
GET /api/auctions
GET /api/auctions/:id
POST /api/auctions

### Pujas
POST /api/auctions/:auctionId/bids

### Billetera
GET /api/wallets
POST /api/wallets/deposits
GET /api/wallets/transactions

### Actividades
GET /api/users/me/auctions
GET /api/users/me/bids

## Seguridad

El sistema utiliza:
- bcrypt para contraseñas.
- JWT para autenticación.
- Middleware para rutas protegidas.
- Transacciones ACID.
- Optimistic locking.
- Validaciones de saldo y reglas de negocio.
- Auditoría de operaciones críticas.