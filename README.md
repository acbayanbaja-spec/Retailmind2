# RetailMind

**AI-Powered Point of Sale, Inventory, and Business Intelligence System**

RetailMind is a modern retail management platform for sales, inventory, customers, suppliers, expenses, reporting, and AI-assisted business insights. Built as a production-quality enterprise SaaS application suitable for real-world retail operations and academic capstone defense.

---

## System Architecture

```
Frontend (Next.js 15)  →  REST API (Express)  →  Prisma ORM  →  PostgreSQL (Supabase)
        ↓                        ↓
     Vercel                   Render
```

### Three-Tier Architecture

1. **Presentation Layer** — Next.js 15 App Router, React 19, TailwindCSS, shadcn/ui
2. **Application/API Layer** — Node.js, Express.js, TypeScript, JWT auth
3. **Data Layer** — PostgreSQL via Supabase, Prisma ORM

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, TanStack Query/Table, Recharts |
| Backend | Node.js, Express.js, TypeScript, Prisma, Zod, JWT, bcrypt |
| Database | PostgreSQL (Supabase) |
| Images | Cloudinary |
| Deployment | Vercel (frontend), Render (backend), Supabase (database) |

---

## Project Structure

```
Retailmind2/
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages
│   ├── components/           # UI and layout components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Sidebar, header, dashboard shell
│   │   └── shared/           # Shared components
│   ├── features/             # Feature-oriented modules
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities, API client, constants
│   ├── providers/            # React context providers
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # API service functions
│   └── types/                # TypeScript types
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access
│   │   ├── middleware/       # Auth, error handling
│   │   ├── validators/       # Zod schemas
│   │   ├── config/           # Environment, CORS
│   │   ├── lib/              # Prisma client
│   │   └── utils/            # Helpers
│   └── prisma/               # Schema, migrations, seed
├── render.yaml               # Render deployment config
├── .github/workflows/ci.yml  # CI pipeline
├── package.json              # Root scripts (build, test)
└── README.md
```

---

## Development Phases

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Architecture & project setup | ✅ Complete |
| 2 | Database schema & Prisma | ✅ Complete |
| 3 | Authentication & authorization | ✅ Complete |
| 4 | Dashboard | ✅ Complete |
| 5 | Products & inventory | ✅ Complete |
| 6 | Point of Sale | ✅ Complete |
| 7 | Customers & suppliers | ✅ Complete |
| 8 | Purchase orders | ✅ Complete |
| 9 | Expenses | ✅ Complete |
| 10 | Reports | ✅ Complete |
| 11 | AI analytics & forecasting | ✅ Complete |
| 12 | Security hardening | ✅ Complete |
| 13 | Testing | ✅ Complete |
| 14 | Deployment preparation | ✅ Complete |
| 15 | Final QA | ✅ Complete |

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your-jwt-secret-min-32-characters-long
JWT_REFRESH_SECRET=your-jwt-refresh-secret-min-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Copy from `.env.example` files. **Never commit real credentials.**

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- npm

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials and JWT secrets
npm install
npx prisma generate
npm run dev
```

API runs at `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

Run backend tests:

```bash
npm test
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`

Run frontend tests:

```bash
npm test
```

---

## API Design

All endpoints return consistent responses:

```json
{ "success": true, "data": {}, "message": "..." }
```

```json
{ "success": false, "message": "...", "errors": [] }
```

### Core Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/api/auth` | ✅ | Login, logout, refresh, profile, password reset |
| `/api/health` | ✅ | Health check |
| `/api/dashboard` | ✅ | Dashboard KPIs, trends, and activity |
| `/api/users` | Pending | User management |
| `/api/products` | ✅ | Product catalog CRUD |
| `/api/inventory` | ✅ | Stock levels, adjustments, transactions |
| `/api/sales` | ✅ | POS checkout, product search, sales history |
| `/api/customers` | ✅ | Customer CRUD, membership, loyalty |
| `/api/suppliers` | ✅ | Supplier CRUD, linked products |
| `/api/purchase-orders` | ✅ | PO lifecycle, receiving, stock updates |
| `/api/expenses` | ✅ | Expense tracking, categories, monthly summary |
| `/api/reports` | ✅ | Business reports (sales, expenses, inventory) |
| `/api/analytics` | ✅ | AI forecasting and recommendations |
| `/api/audit-logs` | ✅ | Administrator activity audit trail |
| `/api/users` | ✅ | Employee account management |
| `/api/settings` | ✅ | System configuration settings |

#### Auth endpoints (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Sign in with email and password |
| POST | `/refresh` | No | Rotate access and refresh tokens |
| POST | `/logout` | Yes | Invalidate refresh token |
| GET | `/me` | Yes | Current user profile and permissions |
| POST | `/change-password` | Yes | Change password (invalidates sessions) |
| POST | `/forgot-password` | No | Request password reset token |
| POST | `/reset-password` | No | Reset password with token |

#### Dashboard endpoints (`/api/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | Yes | KPIs, 7-day sales trend, top products, payments, low stock, activity |

#### Product endpoints (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Paginated product list with search and filters |
| GET | `/meta/categories` | Yes | Active categories for forms |
| GET | `/meta/brands` | Yes | Active brands for forms |
| GET | `/meta/suppliers` | Yes | Active suppliers for forms |
| GET | `/:id` | Yes | Single product detail |
| POST | `/` | Yes | Create product with initial stock |
| PATCH | `/:id` | Yes | Update product metadata |
| DELETE | `/:id` | Yes | Soft-delete (archive) product |

#### Inventory endpoints (`/api/inventory`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Paginated stock levels |
| GET | `/summary` | Yes | Total SKUs, units, low-stock count |
| GET | `/transactions` | Yes | Paginated movement history |
| POST | `/adjust` | Yes | Stock in, out, or adjustment |

#### Sales endpoints (`/api/sales`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | Yes | Search active products for POS |
| GET | `/` | Yes | Paginated sales history |
| GET | `/:id` | Yes | Single sale with items and payments |
| POST | `/` | Yes | Complete a sale (deducts stock, records payment) |

#### Customer endpoints (`/api/customers`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Paginated customer list with search |
| GET | `/:id` | Yes | Customer detail with recent sales |
| POST | `/` | Yes | Create customer with membership |
| PATCH | `/:id` | Yes | Update profile or membership level |
| DELETE | `/:id` | Yes | Soft-delete (archive) customer |

#### Supplier endpoints (`/api/suppliers`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Paginated supplier list with search |
| GET | `/:id` | Yes | Supplier detail with linked products |
| POST | `/` | Yes | Create supplier |
| PATCH | `/:id` | Yes | Update supplier profile |
| DELETE | `/:id` | Yes | Soft-delete (archive) supplier |

#### Purchase order endpoints (`/api/purchase-orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | Yes | Products available for a supplier PO |
| GET | `/` | Yes | Paginated PO list with search and status filter |
| GET | `/:id` | Yes | Purchase order detail with line items |
| POST | `/` | Yes | Create draft purchase order |
| PATCH | `/:id` | Yes | Update draft PO (supplier, notes, items) |
| POST | `/:id/submit` | Yes | Submit draft for approval |
| POST | `/:id/approve` | Yes | Approve pending PO |
| POST | `/:id/order` | Yes | Mark approved PO as ordered |
| POST | `/:id/receive` | Yes | Receive goods (updates inventory) |
| POST | `/:id/cancel` | Yes | Cancel PO (no received items) |
| DELETE | `/:id` | Yes | Archive draft or cancelled PO |

#### Expense endpoints (`/api/expenses`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | Yes | List expense categories |
| POST | `/categories` | Yes | Create expense category |
| PATCH | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Archive category (no linked expenses) |
| GET | `/summary` | Yes | Monthly totals and breakdown by category |
| GET | `/` | Yes | Paginated expense list with filters |
| GET | `/:id` | Yes | Single expense detail |
| POST | `/` | Yes | Record a new expense |
| PATCH | `/:id` | Yes | Update expense |
| DELETE | `/:id` | Yes | Archive expense |

#### Report endpoints (`/api/reports`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/business` | Yes | Combined financial, sales, expense, and inventory report for a date range |

Query params for `/business`: `dateFrom`, `dateTo` (YYYY-MM-DD), optional `groupBy` (`day`, `week`, `month`).

#### Analytics endpoints (`/api/analytics`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/overview` | Yes | Dashboard summary with forecasts and recommendations |
| GET | `/forecasts` | Yes | List forecast history (optional `type`, `limit`) |
| GET | `/recommendations` | Yes | List AI recommendations (optional `includeDismissed`, `limit`) |
| POST | `/generate` | Yes | Regenerate forecasts and recommendations from store data |
| PATCH | `/recommendations/:id` | Yes | Mark recommendation read or dismissed |

#### Audit endpoints (`/api/audit-logs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes (admin) | Paginated activity log with optional filters |

Query params: `page`, `limit`, optional `action`, `userId`, `dateFrom`, `dateTo` (YYYY-MM-DD).

#### User endpoints (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/roles` | Yes (`users.manage`) | List available roles |
| GET | `/` | Yes (`users.manage`) | Paginated employee list |
| GET | `/:id` | Yes (`users.manage`) | Employee details |
| POST | `/` | Yes (`users.manage`) | Create employee account |
| PATCH | `/:id` | Yes (`users.manage`) | Update employee |
| DELETE | `/:id` | Yes (`users.manage`) | Archive employee |

Query params: `page`, `limit`, optional `search`, `isActive`, `role`.

#### Settings endpoints (`/api/settings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes (`settings.manage`) | List all settings |
| PATCH | `/` | Yes (`settings.manage`) | Bulk update settings |
| GET | `/:key` | Yes (`settings.manage`) | Get setting by key |
| PATCH | `/:key` | Yes (`settings.manage`) | Update single setting |

**Development credentials** (after `npm run db:seed`):

- Email: `admin@retailmind.dev`
- Password: `DevPassword123!`

---

## Database

- **Provider:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Migrations:** `prisma migrate dev` (development), `prisma migrate deploy` (production)
- **Seed:** `npm run db:seed` (Phase 2)

---

## Deployment

### Pre-deploy checklist

1. Create a Supabase PostgreSQL project and copy `DATABASE_URL` + `DIRECT_URL`
2. Generate strong JWT secrets (`openssl rand -base64 32`)
3. Set `CORS_ORIGIN` to your Vercel frontend URL (comma-separated if multiple)
4. Configure Cloudinary credentials for product image uploads
5. Run migrations: `cd backend && npx prisma migrate deploy`
6. Seed initial admin (optional): `cd backend && npm run db:seed`
7. Set `NEXT_PUBLIC_API_URL` on Vercel to your Render API URL

### Frontend — Vercel

1. Connect repository to Vercel
2. Set root directory to `frontend`
3. Add `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
4. Deploy (uses `frontend/vercel.json`)

### Backend — Render

1. Use `render.yaml` or create a Web Service manually
2. Build command: `cd backend && npm ci && npm run build && npx prisma migrate deploy`
3. Start command: `cd backend && npm start`
4. Health check path: `/api/health` (returns 503 if database is unreachable in production)
5. Configure all environment variables from `backend/.env.example`

### Database — Supabase

1. Create a PostgreSQL project
2. Copy connection strings to `DATABASE_URL` and `DIRECT_URL`

### CI

GitHub Actions runs on push/PR to `main` or `master`:

- Backend: install, build, test
- Frontend: install, test, build

Run locally from the repo root:

```bash
npm test
npm run build
```

---

## User Roles

| Role | Access |
|------|--------|
| **Administrator** | Full system access |
| **Store Manager** | Sales, inventory, reports, AI analytics |
| **Cashier** | POS, transactions, authorized refunds |

---

## Security

- JWT authentication with refresh token rotation and reuse detection
- bcrypt password hashing (cost factor 12)
- Helmet security headers, strict production CORS, global and auth rate limiting
- HTTP parameter pollution protection and request-body prototype sanitization
- Zod request validation and 1MB JSON body limits
- Role-based authorization with permission checks on every protected route
- Activity audit logging with administrator audit trail UI (`/audit-logs`)
- Production startup checks for weak or duplicate JWT secrets and open CORS
- Generic error messages in production (no stack traces leaked to clients)
- No secrets exposed to frontend

---

## Testing

| Suite | Command | Coverage |
|-------|---------|----------|
| Backend unit & integration | `cd backend && npm test` | Utilities, validators, JWT/password helpers, health endpoint |
| Frontend unit | `cd frontend && npm test` | Formatting and shared UI helpers |

Vitest is used in both packages. Backend tests include request sanitization, pagination/date math, auth/audit schema validation, and a Supertest smoke test for `/api/health`.

---

## License

MIT — Academic capstone project.
