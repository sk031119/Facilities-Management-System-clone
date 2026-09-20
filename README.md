# FASS Polytechnic — Facilities Management System

A full-stack web application for managing campus facilities at FASS Polytechnic, built for the ITE-5425 Web Framework 2 course project.

## Team

**Team FASS** — FASS Polytechnic, ITE-5425 Web Framework 2, Winter 2026  
Members: Fawzaan, Samuel, Ari, Scarlett

## Project Overview

This repository contains the Facilities Management system inside the `facilities-app/` application. The system includes:

- a public room browser
- room details with assets, maintenance, and timetable data
- campus explorer with outdoor and indoor map views
- admin tools for rooms, campuses, buildings, maintenance, tags, and users
- role-based access for `PUBLIC`, `STAFF`, and `ADMIN`
- Scheduler module integration for availability and timetable data

## Repository Structure

```text
fass/
├── README.md                 # Root project overview
└── facilities-app/           # Main Next.js application
    ├── README.md             # App-level setup and feature guide
    ├── docs/                 # Detailed documentation
    ├── prisma/               # Database schema and seed
    ├── public/branding/      # Branding assets
    ├── scripts/              # Helper scripts
    └── src/                  # App source code
```

## Quick Start

```bash
cd facilities-app
npm install
cp .env.example .env
npx prisma db push
npx prisma generate
npm run dev
```

Optional local data setup:

```bash
npx prisma db seed
npx tsx scripts/create-users.mjs
```

Local test users created by the helper script:

- `admin@fass.ca`
- `staff@fass.ca`

Password:

```text
password123
```

## Documentation Links

- [App README](facilities-app/README.md)
- [Consumer API reference](facilities-app/docs/public-api.md)
- [Internal API specification](facilities-app/docs/api_spec.md)
- [Role and access rules](facilities-app/docs/role_access.md)
- [UI architecture](facilities-app/docs/ui_architecture.md)
- [Data flow](facilities-app/docs/data_flow.md)
- [Deliverable mapping](facilities-app/docs/deliverables.md)

## Main Application Areas

- Public room browser: `facilities-app/src/app/page.tsx`
- Campus explorer: `facilities-app/src/app/campuses/page.tsx`
- Room details: `facilities-app/src/app/rooms/[id]/page.tsx`
- Admin pages: `facilities-app/src/app/admin/`
- API routes: `facilities-app/src/app/api/`
- In-app API reference: `facilities-app/src/app/api-docs/`

## Notes

- Branding configuration lives in `facilities-app/src/lib/brand.ts`
- Theme support is handled by `facilities-app/src/components/ui/theme-provider.tsx`
- Scheduler integration is handled in `facilities-app/src/lib/scheduler.ts`
