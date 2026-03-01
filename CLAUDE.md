# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Teodor Barbershop — Russian barbershop website with online booking, portfolio gallery, and admin panel. Node.js/Express backend, vanilla JS frontend, SQLite database.

**Remote**: `git@github.com:great105/teodor-barbershop.git`

## Commands

```bash
npm install          # install dependencies
npm run seed         # populate database with demo data
npm start            # start server (default port 3000)
```

No test runner or linter is configured. No build step — frontend is served as static files.

## Environment Variables

| Variable         | Default       | Description          |
|------------------|---------------|----------------------|
| `PORT`           | `3000`        | Server port          |
| `ADMIN_PASSWORD` | `teodor2024`  | Admin panel password |

## Architecture

### Backend (server/)

Express app (`server/app.js`) with better-sqlite3 (synchronous, WAL mode).

**Routes** — all under `/api`:
- `routes/public.js` — read-only endpoints: services, team, gallery, settings, contact form
- `routes/booking.js` — timeslots and booking creation with role-based price calculation
- `routes/auth.js` — password-only login, 24h token sessions via httpOnly cookie `admin_token`
- `routes/admin.js` — full CRUD for all entities, protected by `middleware/auth.js` (`requireAdmin`)

**Database** (`server/db/`):
- `schema.sql` — 9 tables auto-created on startup via `connection.js`
- `seed.js` — demo data (services, team, gallery, timeslots, settings)
- DB file `teodor.db` is gitignored

### Frontend

HTML pages in root directory, JS modules in `public/js/`. No framework — vanilla JS with Tailwind CSS v3 from CDN.

**Key modules**:
- `api.js` — fetch wrapper singleton (`TheodorAPI`), used by all pages
- `booking-wizard.js` (558 lines) — 4-step booking form: services → barber/date/time → contact → confirm
- `admin-app.js` (533 lines) — tab-based admin SPA (bookings, services, team, gallery, messages, settings)

### Pricing System

4 types: `flat` (single price), `split` (top-барбер/brand-барбер prices), `range` (min-max), `promo` (discount text). Price calculation in `booking.js` depends on selected barber's `role_key`.

## Design Tokens (Tailwind)

- **primary**: `#cf1717` (red)
- **accent-gold**: `#d4af37`
- **background-dark**: `#211111`, **surface-dark**: `#2a1d1d`
- **Fonts**: Work Sans (display), Caveat (accent)

## Conventions

- All UI text is in Russian
- Static assets use long-cache headers (30 days) for images/fonts; no-cache for HTML
- Admin panel is at `/admin.html` with SPA fallback on `/admin`
- Pages load data via API on DOMContentLoaded — HTML files are templates with empty containers
