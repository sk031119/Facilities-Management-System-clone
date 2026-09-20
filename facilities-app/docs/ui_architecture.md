# UI Architecture

This document summarizes the main pages, layouts, and data-loading approach used in the Facilities Management module.

## Layout Structure

- `src/app/layout.tsx` provides the public application shell
- `src/app/admin/layout.tsx` provides the admin shell and sidebar
- `src/components/layout/SiteHeader.tsx` is shared across public pages
- `src/components/layout/AdminSidebar.tsx` is used in the admin area
- `src/components/ui/theme-provider.tsx` manages light and dark theme state
- `src/lib/brand.ts` provides configurable brand colors, text, and logo paths

## Public Pages

### Room Browser

- Route: `/`
- Purpose: browse and filter rooms
- Data source: Prisma queries for room list, filter options, and summary counts
- Key behaviors:
  - filtering by search text, status, campus, building, tag, room type, and capacity range
  - summary cards for room status mix, campus count, building count, and maintenance count
  - paginated room listing
- Main components:
  - `RoomFilters`
  - `RoomGrid`
  - `RoomCard`
  - `Pagination`

### Room Detail

- Route: `/rooms/[id]`
- Purpose: show room information, assets, maintenance, and timetable
- Data source:
  - Prisma for room, building, campus, tags, assets, and maintenance
  - Scheduler integration for timetable data
- Key behaviors:
  - shows active maintenance issues
  - shows tracked room assets
  - exposes building and campus context plus link into the campus explorer
  - uses fallback timetable data state when scheduler data is unavailable
- Main component:
  - `TimetableView`

### Campus Explorer

- Route: `/campuses`
- Purpose: explore campuses, buildings, and rooms
- Data source: Prisma campus, building, and room queries
- Key behaviors:
  - outdoor campus map view
  - indoor navigator by floor
  - room directory view
  - search across campus, building, and room data
- Main components:
  - `CampusExplorer`
  - `CampusLeafletMap`
  - `IndoorLeafletMap`

### Authentication

- Routes:
  - `/login`
  - `/signup`
- Key behaviors:
  - self-registration creates `PUBLIC` users
  - sign-in state controls admin navigation visibility
- Main components:
  - `LoginForm`
  - `SignupForm`

## Admin Pages

### Dashboard

- Route: `/admin`
- Purpose: operational summary of rooms and maintenance
- Key behaviors:
  - room totals by status
  - active maintenance totals
  - recent maintenance feed
  - campus status breakdown
- Main components:
  - `OperationsShowcase`
  - `OperationsCharts`
  - `RecentMaintenanceTable`

### Rooms

- Route: `/admin/rooms`
- Purpose: create, update, and remove rooms
- Key behaviors:
  - room search and filtering
  - sorting across room data columns
  - room asset management from the room table
- Main components:
  - `RoomsDataTable`
  - `RoomFormModal`
  - `DeleteRoomDialog`
  - `RoomAssetsDialog`

### Campuses

- Route: `/admin/campuses`
- Purpose: manage campus records and building hierarchy
- Key behaviors:
  - edit campus map placement values
  - address suggestion lookup for Canadian addresses
  - auto-fill latitude and longitude from selected address suggestions
  - saved coordinates support outdoor and indoor navigation context
- Main components:
  - `BuildingTree`
  - `CampusFormModal`

### Buildings

- Route: `/admin/buildings`
- Purpose: manage buildings within campuses
- Main components:
  - `BuildingsDataTable`
  - `BuildingFormModal`

### Maintenance

- Route: `/admin/maintenance`
- Purpose: review and update maintenance issues
- Key behaviors:
  - filter by status, priority, and text query
  - create, update, resolve, and remove issues
  - room status can return to available when a maintenance issue is resolved
- Main components:
  - `MaintenanceDataTable`
  - `MaintenanceIssueDialog`

### Tags

- Route: `/admin/tags`
- Purpose: manage room tags
- Main components:
  - `TagsDataTable`
  - `TagFormModal`

### Users

- Route: `/admin/users`
- Purpose: review users and update roles
- Key behaviors:
  - self-signup users start as `PUBLIC`
  - admins can promote or demote users between `PUBLIC`, `STAFF`, and `ADMIN`
- Main component:
  - `UsersDataTable`

## Data Loading Pattern

- Server Components load the initial page data from Prisma
- Client Components handle filtering, forms, dialogs, and interactive tables
- API route handlers process mutations and return JSON responses
- Validation is handled with Zod before data is written to the database

## Supporting UI

- `src/app/api-docs/page.tsx` provides an in-app view of the consumer API
- `src/components/ui/` contains shared UI primitives used across public and admin pages
- `ThemeToggle` in the shared header exposes light and dark mode switching
- Header branding uses the configured light and dark logo assets from `public/branding/`

## API And Integration Surface

- `src/app/api/` contains the Facilities route handlers
- `src/app/api-docs/page.tsx` mirrors the consumer-facing API contract inside the app
- `src/lib/scheduler.ts` integrates with the Scheduler module for timetable and availability data
