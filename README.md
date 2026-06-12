# KostManager - Full Stack Property Management System

A complete property management system for kost/kontrakan owners in Indonesia, built with modern web technologies.

## Tech Stack

### Frontend
- **Framework**: TanStack Router (file-based routing)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Build Tool**: Vite
- **State Management**: React Context + Custom Hooks

### Backend
- **Framework**: Hono (lightweight web framework)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better Auth (email/password)
- **Runtime**: Node.js

## Features

### Core Features (MVP)
- ✅ **Property Management**: Create and manage multiple properties
- ✅ **Unit Management**: Track individual rooms/units with status
- ✅ **Tenant Management**: Store tenant information with KTP data
- ✅ **Billing System**: Auto-generate monthly bills
- ✅ **Payment Recording**: Record payments with multiple methods
- ✅ **Dashboard**: Real-time metrics and statistics
- ✅ **Notifications**: Track email and in-app notifications
- ✅ **Authentication**: Secure login/register with session management

### Business Logic
- Auto-calculate occupancy rates
- Track bill status (pending/paid/overdue/partial)
- Update unit status when tenants check in/out
- Generate monthly bills for active tenants
- Mark overdue bills automatically

## Project Structure

```
kostmanager-oc/
├── src/                          # Frontend source
│   ├── routes/                   # TanStack Router file-based routes
│   │   ├── (auth)/              # Auth routes (login, register)
│   │   ├── dashboard/           # Dashboard routes
│   │   │   ├── properties/      # Property management
│   │   │   ├── tenants/         # Tenant management
│   │   │   ├── bills/           # Bill management
│   │   │   └── ...
│   │   └── portal/              # Tenant portal
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Layout components
│   └── lib/                     # Utilities and API client
│       ├── api.ts               # API client
│       ├── auth-context.tsx     # Auth context provider
│       └── hooks.ts             # Custom hooks (useQuery, useMutation)
├── server/                      # Backend source
│   ├── db/                      # Database schema and connection
│   │   ├── schema.ts            # Drizzle ORM schema
│   │   └── index.ts             # Database connection
│   ├── auth/                    # Better Auth configuration
│   ├── routes/                  # API route handlers
│   │   ├── properties.ts
│   │   ├── units.ts
│   │   ├── tenants.ts
│   │   ├── bills.ts
│   │   ├── payments.ts
│   │   └── notifications.ts
│   ├── services/                # Business logic
│   │   └── billing.ts           # Bill generation logic
│   └── index.ts                 # Server entry point
├── drizzle/                     # Database migrations
└── kostmanager.db               # SQLite database file
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kostmanager-oc
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
```bash
pnpm db:push
```

This creates the SQLite database and applies the schema.

### Running the Application

You need to run both the backend and frontend servers:

**Terminal 1 - Backend (port 3001):**
```bash
pnpm dev:server
```

**Terminal 2 - Frontend (port 3000):**
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### First Time Setup

1. Open http://localhost:3000 in your browser
2. Click "Daftar" (Register) to create an account
3. After registration, you'll be redirected to the dashboard
4. Start by adding your first property:
   - Click "Tambah Properti"
   - Fill in property details
   - Add units to the property
   - Add tenants to occupied units

## API Endpoints

### Authentication
- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Units
- `GET /api/units?propertyId=X` - List units (optional filter)
- `GET /api/units/:id` - Get unit details
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Bills
- `GET /api/bills` - List all bills
- `GET /api/bills/:id` - Get bill details
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification

### Billing Services
- `POST /api/billing/generate` - Generate monthly bills
- `POST /api/billing/check-overdue` - Mark overdue bills

## Database Schema

### Core Tables
- **users**: Owner/manager accounts
- **sessions**: Authentication sessions
- **properties**: Kost/kontrakan/apartemen
- **units**: Individual rooms with status and pricing
- **tenants**: Occupant information with KTP data
- **bills**: Monthly invoices with breakdown
- **payments**: Payment records
- **notifications**: Email and in-app notification logs

## Available Scripts

```bash
# Development
pnpm dev              # Start frontend dev server (port 3000)
pnpm dev:server       # Start backend server (port 3001)

# Database
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Build
pnpm build            # Build for production
pnpm preview          # Preview production build

# Type Checking
pnpm typecheck        # Run TypeScript type checking
```

## Key Features Explained

### Auto-Generate Monthly Bills
The system can automatically generate bills for all active tenants:
```bash
curl -X POST http://localhost:3001/api/billing/generate \
  -H "Cookie: your-session-cookie"
```

### Payment Recording
When a payment is recorded:
1. Payment is created with the specified amount
2. Bill status is automatically updated:
   - `paid` if total payments >= bill amount
   - `partial` if some payment received
   - `pending` if no payments

### Unit Status Management
- When a tenant is added to a unit, status changes to `occupied`
- When a tenant is marked inactive, status changes to `available`
- Units can also be set to `maintenance` status

### Authentication Flow
1. User registers with email/password
2. Better Auth creates user and session
3. Session cookie is set in browser
4. All API requests include session cookie
5. Backend validates session on protected routes

## Customization

### Adding New Fields
1. Update schema in `server/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply changes
4. Update API routes in `server/routes/`
5. Update frontend types and API client

### Styling
- Global styles: `src/app.css`
- Theme variables: Tailwind CSS v4 `@theme` directive
- Component styles: Tailwind utility classes

### Adding New Pages
1. Create new file in `src/routes/`
2. Export route using `createFileRoute`
3. Route is automatically registered by TanStack Router

## Production Deployment

### Build & run (Node)
```bash
pnpm build            # outputs dist/ (client + SSR server)
pnpm start            # serves the build via server.mjs (PORT=3000)
```

### Run with Docker
The included multi-stage `Dockerfile` builds the app and runs it with a small
zero-dependency Node server. On boot the container **auto-migrates** the schema
and **auto-seeds** demo data (idempotent).

```bash
docker build -t kostmanager .

# Persist the SQLite DB in a named volume; override the auth secret in real use.
docker run -p 3000:3000 \
  -v kostmanager-data:/app/data \
  -e BETTER_AUTH_SECRET="$(openssl rand -hex 32)" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  kostmanager
```

Then open http://localhost:3000. Seeded demo logins:
- **Owner** — `/login` → `owner@demo.com` / `password123`
- **Tenant** — `/portal/register` → `tenant@demo.com` (choose any password ≥ 8)

Set `-e SEED=false` to skip demo seeding (migration still runs).

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_PATH` | `kostmanager.db` (`/app/data/kostmanager.db` in Docker) | SQLite file location |
| `BETTER_AUTH_SECRET` | dev fallback | **Set a strong secret in production** |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public base URL (cookies / trusted origin) |
| `SEED` | `true` in Docker | Auto-seed demo data on boot |

### Database
For production, consider:
- Using PostgreSQL instead of SQLite
- Setting up database backups
- Configuring connection pooling

### Hosting Options
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Fly.io, or any Node.js host
- **Database**: Neon, Supabase, or managed PostgreSQL

## Auto Bill Generation (Upcoming Bills)

Sistem KostManager dilengkapi dengan auto-generate tagihan H-7 sebelum tanggal jatuh tempo sewa untuk mempermudah persiapan pembayaran.
- **Jadwal Otomatis**: Auto bills berjalan setiap hari pukul 00:00 (dikonfigurasi menggunakan Vercel Cron di `vercel.json` dan `AUTO_BILL_SCHEDULE` di `.env`).
- **Trigger Manual**: Untuk menjalankan generate tagihan secara manual kapan saja, panggil request `POST /api/bills/upcoming`.
- **Preview Draft**: Untuk melihat daftar tagihan H-7 yang akan terbentuk tanpa menyimpannya ke database, panggil request `GET /api/bills/upcoming`.

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Issues
```bash
# Reset database
rm kostmanager.db
pnpm db:push
```

### Type Errors
```bash
pnpm typecheck
```

### Build Errors
```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

## Future Enhancements

- [ ] WhatsApp notifications
- [ ] Payment gateway integration (Xendit/Midtrans)
- [ ] Digital contracts with e-signature
- [ ] Deposit management
- [ ] Maintenance request system
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Advanced reporting and analytics

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
