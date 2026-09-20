# Facilities Management Module

Facilities Management Module is a Next.js application for browsing campus rooms and managing facility records. It includes a public room directory and protected admin tools for rooms, campuses, buildings, maintenance, and user roles.

## Core Features

- Public room browser with search, status, campus, building, tag, room type, and capacity filters
- Room summary cards showing availability mix, campus count, building count, and rooms needing service
- Room detail page with building context, tags, assets, active maintenance logs, and timetable data
- Campus explorer with outdoor campus map, indoor navigator, and room directory views
- Campus and building map data with saved coordinates plus address-based fallback behavior
- Campus address suggestions that auto-fill latitude and longitude for map placement
- Admin dashboard with room status totals, campus breakdowns, charts, and recent maintenance activity
- Management flows for campuses, buildings, rooms, tags, assets, and maintenance records
- User self-registration plus admin role assignment for `PUBLIC`, `STAFF`, and `ADMIN`
- Light and dark theme support with persistent theme preference
- Config-based branding with swappable logo assets and brand colors
- Read-only consumer API for rooms, campuses, buildings, tags, assets, and dashboard summaries
- Scheduler module integration for timetable and availability data

## Feature Coverage

### Public Experience

- Browse rooms from `/` with filtering and pagination
- Open `/rooms/[id]` for room details, assets, maintenance, and schedule context
- Use `/campuses` to explore campuses, buildings, floors, and rooms visually
- Switch between outdoor campus map, indoor floor navigator, and room directory views
- Sign in at `/login` or create an account at `/signup`

### Admin Experience

- Review operational summaries from `/admin`
- Manage room records from `/admin/rooms`
- Maintain campus and building structure from `/admin/campuses` and `/admin/buildings`
- Track service issues from `/admin/maintenance`
- Manage feature tags from `/admin/tags`
- Review users and assign roles from `/admin/users`

### Integrations And Behavior

- Scheduler timetable requests fall back safely when the external service is unavailable
- Campus address suggestions use Nominatim and can fill latitude and longitude values
- Consumer `GET` endpoints support optional API-token protection through `FACILITIES_API_TOKEN`

## Branding And Theme

- Brand settings are centralized in `src/lib/brand.ts`
- Logo assets are loaded from `public/branding/logo-light.png` and `public/branding/logo-dark.png`
- Theme state is managed by `src/components/ui/theme-provider.tsx`
- The header exposes theme switching and uses the configured branding assets

# API Base URL

- Production: `https://fass-facilities.vercel.app`

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- PostgreSQL
- Prisma 7
- Better Auth
- Tailwind CSS
- Zod

## Project Structure

```text
facilities-app/
├── docs/                      # Project documentation
├── prisma/                    # Prisma schema and seed
├── public/
│   └── branding/              # Light/dark logo assets
├── scripts/                   # Local helper scripts
└── src/
    ├── app/
    │   ├── admin/               # Admin pages
    │   ├── api/                 # Route handlers
    │   ├── api-docs/            # In-app consumer API reference
    │   ├── campuses/            # Campus explorer page
    │   ├── login/               # Login page
    │   ├── rooms/[id]/          # Room details page
    │   └── signup/              # Self-registration page
    ├── components/
    │   ├── admin/               # Admin tables, forms, dialogs, maps
    │   ├── auth/                # Login and signup forms
    │   ├── layout/              # Header and sidebar
    │   ├── room-browser/        # Public room browser UI
    │   └── ui/                  # Shared UI primitives and theme components
    ├── lib/
    │   ├── brand.ts             # Branding config
    │   ├── campus-map.ts        # Indoor/outdoor map helpers
    │   ├── scheduler.ts         # Scheduler module integration
    │   └── validations/         # Zod schemas
    └── types/                   # Shared application types
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create the local environment file:

```bash
cp .env.example .env
```

3. Set the required variables in `.env`:

- `DB_URL`
- `DB_SCHEMA=facilities_schema`
- `FACILITIES_API_TOKEN`

4. Push the schema and generate Prisma client:

```bash
npx prisma db push
npx prisma generate
```

5. Start the development server:

```bash
npm run dev
```

Optional sample data:

```bash
npx prisma db seed
npx tsx scripts/create-users.mjs
```

Default local test users created by the helper script:

- `admin@fass.ca`
- `staff@fass.ca`

Password:

```text
password123
```

## Main Routes

- `/` room browser
- `/rooms/[id]` room details
- `/campuses` campus explorer
- `/admin` admin dashboard
- `/admin/rooms` room management
- `/admin/campuses` campus management
- `/admin/buildings` building management
- `/admin/maintenance` maintenance management
- `/admin/tags` tag management
- `/admin/users` user role management
- `/login` sign in
- `/signup` self registration
- `/api-docs` in-app consumer API reference

## API And Integration Points

- `/api-docs` exposes the consumer-facing API in the UI
- `docs/public-api.md` documents external read-only endpoints
- `docs/api_spec.md` documents the full internal route surface
- `src/lib/scheduler.ts` handles Scheduler module requests for timetable and availability support

## Documentation Index

- [Project overview and setup](README.md)
- [Consumer API reference](docs/public-api.md)
- [Internal API specification](docs/api_spec.md)
- [Role and access rules](docs/role_access.md)
- [UI architecture](docs/ui_architecture.md)
- [Data flow](docs/data_flow.md)
- [Deliverable mapping](docs/deliverables.md)
