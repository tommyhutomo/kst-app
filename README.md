# Kost Manager — Vercel + Neon

Node.js serverless API and static UI for the Kost Management System (ERD, sitemap, screen mockups, reports, booking receipt).

## Stack

- **Runtime:** Node.js 18+ on Vercel (`/api/*` serverless functions)
- **Database:** Neon PostgreSQL via `@neondatabase/serverless`
- **UI:** Screen mockups in `public/` wired to REST API

## Database setup (Neon)

Run SQL in order (Neon SQL Editor or `psql`):

1. `sql/01_tables.sql`
2. `sql/02_views.sql`
3. `sql/03_seed.sql` (optional demo data)

## Local development

```powershell
cd App
copy .env.example .env.local
# Set DATABASE_URL in .env.local
npm install
npx vercel dev
```

Open `http://localhost:3000/login.html`  
Default login (see `.env.example`): `admin@kost.com` / `changeme`

## Deploy to Vercel

1. Import project folder `App` in Vercel (or `vercel link` from `App`).
2. Set environment variables:
   - `DATABASE_URL` — Neon connection string
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`
   - Optional: `API_TOKEN` (requires `Authorization: Bearer` on all `/api/*` except health/login)
   - Optional: `RECEIPT_COMPANY_NAME` (default: TOMITHA HOUSING)
3. Deploy: `npm run deploy` or push via Git integration.

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login` |
| Dashboard | `/api/dashboard/summary`, `income-expense`, `pengeluaran-pie`, `tagihan-jatuh-tempo` |
| Master | `/api/tipe-property`, `/api/tipe-kamar`, `/api/tipe-transaksi` |
| Data | `/api/properties`, `/api/kamar`, `/api/booking`, `/api/transaksi`, `/api/penghuni-kamar` |
| Reports | `/api/reports/penghuni-aktif`, `kamar-kosong`, `tagihan-penghuni`, `keuangan`, `booking` |
| Receipt | `GET /api/booking/:id/receipt` (HTML — matches booking receipt template) |

Report views map 1:1 to `sql/02_views.sql` as specified in the report requirement sheet.
