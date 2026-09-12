# Mini Operations ERP

A full-stack **Mini Operations ERP** system built with React.js, Node.js, Express.js, and PostgreSQL. Demonstrates a complete production operations flow: Inventory → Work Orders → Stock Transfers → Customer Orders → Stock Reservation with concurrency-safe locking.

---

## 🌐 Live Deployment

| Service | Live URL |
|---|---|
| 🌐 **Frontend App** | [https://mini-erp-operations-portal-cs-2.vercel.app](https://mini-erp-operations-portal-cs-2.vercel.app) |
| ⚙️ **Backend API** | [https://mini-erp-operations-portal-cs-2.onrender.com](https://mini-erp-operations-portal-cs-2.onrender.com) |
| 📖 **Swagger API Docs** | [https://mini-erp-operations-portal-cs-2.onrender.com/api-docs](https://mini-erp-operations-portal-cs-2.onrender.com/api-docs) |
| 🏥 **Health Check** | [https://mini-erp-operations-portal-cs-2.onrender.com/health](https://mini-erp-operations-portal-cs-2.onrender.com/health) |

---

## Features

| Module | Description |
|---|---|
| **Authentication** | JWT-based login with bcrypt password hashing |
| **Role-Based Authorization** | ADMIN / OPERATIONS_USER / SALES_USER |
| **Inventory Management** | Physical, reserved, and available quantity tracking |
| **Work Orders** | Material requirements with shortage calculation |
| **Stock Transfers** | Internal movements with REQUESTED → DISPATCHED → RECEIVED flow |
| **Customer Orders** | Order creation with concurrency-safe stock reservation |
| **Concurrency Control** | PostgreSQL `SELECT FOR UPDATE` prevents race conditions |
| **API Documentation** | Swagger/OpenAPI at `/api-docs` |
| **Tests** | 6 test scenarios including concurrency test |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, React Router v6, Axios, CSS3 |
| Backend | Node.js, Express.js, REST APIs |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | Zod |
| API Docs | Swagger/OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) |
| Testing | Jest + Supertest |
| Security | Helmet, express-rate-limit, CORS |

---

## Project Structure

```
Company_Assignment_ERM-Case 2/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── config/
│   │   │   ├── database.js        # Prisma client singleton
│   │   │   └── swagger.js         # Swagger/OpenAPI config
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── services/              # Business logic layer
│   │   ├── routes/                # API route definitions
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── authorize.js       # Role-based access control
│   │   │   ├── validate.js        # Zod validation wrapper
│   │   │   └── errorHandler.js    # Centralized error handler
│   │   ├── validators/            # Zod schemas
│   │   ├── errors/                # Custom error classes
│   │   └── utils/                 # Response helpers, number generators
│   ├── prisma/
│   │   ├── schema.prisma          # 12-table database schema
│   │   └── seed.js                # Demo data seeder
│   ├── tests/                     # Jest + Supertest tests
│   ├── server.js                  # Entry point
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios API modules per feature
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # AuthContext (global auth state)
│   │   ├── pages/                 # Page components
│   │   ├── App.jsx                # React Router setup
│   │   └── index.css              # Global design system CSS
│   └── .env.example
│
├── postman/
│   └── Mini_ERP.postman_collection.json
└── README.md
```

---

## Database Schema / ER Diagram

```mermaid
erDiagram
    User ||--o{ WorkOrder : "assigns"
    User ||--o{ CustomerOrder : "creates"
    Category ||--o{ Item : "classifies"
    Item ||--o{ Inventory : "tracked_in"
    Location ||--o{ Inventory : "stores"
    Batch ||--o{ Inventory : "groups"
    Inventory ||--o{ InventoryTransaction : "logs"
    Item ||--o{ WorkOrder : "requires"
    Location ||--o{ WorkOrder : "produced_at"
    Item ||--o{ StockTransfer : "transfers"
    Location ||--o{ StockTransfer : "source"
    Location ||--o{ StockTransfer : "destination"
    CustomerOrder ||--o{ CustomerOrderItem : "contains"
    Item ||--o{ CustomerOrderItem : "ordered_item"
    Inventory ||--o{ CustomerOrderItem : "reserves_from"

    User {
        string id PK
        string email UK
        string name
        string role
    }
    Item {
        string id PK
        string code UK
        string name
        string unit
    }
    Inventory {
        string id PK
        decimal physical_qty
        decimal reserved_qty
    }
    WorkOrder {
        string id PK
        string order_number UK
        decimal required_qty
        string status
    }
    StockTransfer {
        string id PK
        string transfer_number UK
        decimal quantity
        string status
    }
    CustomerOrder {
        string id PK
        string order_number UK
        string customer_name
        string status
    }
```

---

## Database Setup

### Prerequisites
- PostgreSQL 14+ installed and running
- Create a database: `CREATE DATABASE mini_erp_db;`

### Quick Setup with Docker (Optional)
```bash
docker run --name mini-erp-pg \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=mini_erp_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mini_erp_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
BCRYPT_ROUNDS=12
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## Installation & Running

The application requires two terminal windows (one for the Backend API and one for the Frontend client).

### Terminal 1: Backend API (Port 5000)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed demo data (users, inventory, etc.)
npm run prisma:seed

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`
API Docs at: `http://localhost:5000/api-docs`

### Terminal 2: Frontend Client (Port 5173)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## User Roles & Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **ADMIN** | admin@erp.com | Admin@123 | Create work orders, view all data |
| **OPERATIONS_USER** | ops@erp.com | Ops@123 | Manage inventory, handle transfers |
| **SALES_USER** | sales@erp.com | Sales@123 | Create orders, reserve stock |

---

## API Documentation

Full Swagger UI available at: `http://localhost:5000/api-docs`

### Key Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/inventory` | All | Get all inventory with available qty |
| POST | `/api/inventory` | OPS/ADMIN | Create inventory record |
| POST | `/api/inventory/add-stock` | OPS/ADMIN | Add stock to inventory |
| GET | `/api/work-orders` | ADMIN/OPS | Get work orders with shortage |
| POST | `/api/work-orders` | ADMIN | Create work order |
| PUT | `/api/work-orders/:id/status` | ADMIN/OPS | Update status |
| POST | `/api/transfers` | OPS | Create transfer request |
| POST | `/api/transfers/:id/dispatch` | OPS | Dispatch (reduces source inventory) |
| POST | `/api/transfers/:id/receive` | OPS | Receive (increases dest inventory) |
| POST | `/api/orders` | SALES | Create customer order |
| POST | `/api/orders/:id/reserve` | SALES | Reserve stock (concurrency-safe) |

---

## Business Rules

### Inventory
- `Available Quantity = Physical Quantity - Reserved Quantity`
- Backend prevents: negative inventory, reservation beyond available, invalid quantities

### Work Orders
- `Shortage = max(0, Required Quantity - Available Quantity)`
- Calculated fresh from database on every request

### Stock Transfers
- **DISPATCH**: Only reduces source inventory - destination is unchanged
- **RECEIVE**: Increases destination inventory
- A transfer cannot be received twice (returns HTTP 409)

### Stock Reservation (Concurrency)
The reservation endpoint uses **PostgreSQL row-level locking**:
```sql
SELECT * FROM inventory WHERE id = $1 FOR UPDATE;
```
This ensures that if two users try to reserve the same stock simultaneously:
- The first request acquires the lock and checks availability
- The second request waits until the first commits
- Only one succeeds if stock is insufficient for both

---

## Running Tests

```bash
cd backend

# Setup test environment
cp .env.example .env.test
# Edit .env.test to point to a test database

# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

### Test Coverage

| Test | Description |
|---|---|
| **TEST 1** | Cannot reserve more than available inventory |
| **TEST 2** | Cannot transfer more than available at source |
| **TEST 3** | Destination stock unchanged after dispatch, increases after receive |
| **TEST 4** | Same transfer cannot be received twice (409) |
| **TEST 5** | Wrong role returns 403 Forbidden |
| **TEST 6** | Concurrency: simultaneous reservations - only one succeeds |

---

## Postman Collection

Import `postman/Mini_ERP.postman_collection.json` into Postman.

The Login requests automatically capture the JWT token into a collection variable. Set `BASE_URL` to `http://localhost:5000`.

---

## AWS Deployment Overview

The application is AWS-ready with environment-based configuration:

| Component | AWS Service |
|---|---|
| Backend (Node.js) | EC2 (t3.micro/small) or Elastic Beanstalk |
| PostgreSQL Database | RDS PostgreSQL (db.t3.micro) |
| Frontend (React) | S3 + CloudFront, or Amplify |
| Environment Config | AWS Parameter Store / Secrets Manager |

**Key steps:**
1. Provision RDS PostgreSQL and get the connection string
2. Update `DATABASE_URL` in backend environment
3. Deploy backend to EC2 (use PM2 for process management)
4. Build frontend: `npm run build` and upload `dist/` to S3
5. Configure CloudFront distribution for the S3 bucket

No business logic depends on AWS - any provider works.

---

## Interview Q&A Reference

1. **Why React?** Component-based architecture, declarative UI, large ecosystem, context API for state
2. **Why Node.js/Express?** Non-blocking I/O, same language as frontend, lightweight and fast
3. **Why PostgreSQL?** ACID compliance, proper transactions, row-level locking for concurrency
4. **How JWT works?** Login returns signed token → stored client-side → sent in Authorization header → backend verifies signature
5. **How RBAC works?** JWT contains role → `authorize()` middleware checks role before controller runs
6. **How inventory is calculated?** Available = Physical - Reserved, computed fresh from DB, never stored
7. **Why SELECT FOR UPDATE?** Locks the row in a transaction to prevent concurrent over-reservation
8. **Why destination stock doesn't increase on dispatch?** Item is in transit - not yet confirmed received; prevents phantom inventory

---

## Live Verification Guide (Common Interview Modifications)

If asked to implement one of the 4 live test modifications during evaluation:

### 1. Add `damagedQty`
- **Schema**: Add `damagedQty Decimal @default(0) @map("damaged_qty") @db.Decimal(15, 3)` to `Inventory` model in `schema.prisma`.
- **Calculation**: Change available formula in `inventory.service.js` to:
  `available = physical - reserved - damaged`
- **Migration**: Run `npx prisma db push`.

### 2. Allow Partial Transfer Receipt
- **Endpoint**: Update `POST /api/transfers/:id/receive` to accept a `{ receivedQty }` body parameter.
- **Logic**: In `transfer.service.js`, increment destination inventory by `receivedQty`. If `receivedQty < quantity`, mark status as `PARTIALLY_RECEIVED` or keep remaining balance in `REQUESTED`.

### 3. Cancel Order & Release Reserved Stock
- **Endpoint**: Add `POST /api/orders/:id/cancel`.
- **Transaction**: In `order.service.js`, inside `prisma.$transaction`:
  1. Verify order status is `RESERVED` or `PENDING`.
  2. For each reserved item, decrement `inventory.reservedQty` by `item.reservedQty`.
  3. Create an `INVENTORY_TRANSACTION` with type `CANCELLATION_RELEASE`.
  4. Update order status to `CANCELLED`.

### 4. Restrict Users by Assigned Location
- **Schema**: Add `assignedLocationId String? @map("assigned_location_id")` to `User` model.
- **Middleware**: In `authorize.js`, verify `req.user.assignedLocationId === req.body.locationId`.

