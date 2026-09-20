# Facilities API Internal Specification

This document lists the full API surface implemented in the Facilities module.

Base URL:

- Production: `https://fass-facilities.vercel.app`
- Local: `http://localhost:3000`

## Response Conventions

- Success responses return JSON
- Most successful responses use `{ "data": ... }`
- Write operations may also include a `"message"` field
- Error responses include an `"error"` field
- Validation failures may include `"details"`

## Consumer Routes

These routes are intended for read-only access.

- `GET /api/rooms`
- `GET /api/rooms/{id}`
- `GET /api/rooms/{id}/availability`
- `GET /api/rooms/{id}/timetable`
- `GET /api/rooms/{id}/assets`
- `GET /api/rooms/{id}/assets/{assetId}`
- `GET /api/buildings`
- `GET /api/buildings/{id}`
- `GET /api/campuses`
- `GET /api/campuses/{id}`
- `GET /api/tags`
- `GET /api/tags/{id}`
- `GET /api/dashboard/room-status-summary`

Authentication behavior:

- If `FACILITIES_API_TOKEN` is not configured, these routes are open
- If `FACILITIES_API_TOKEN` is configured, a valid API token or authenticated session is required

## Protected Routes

These routes require an authenticated Better Auth session.

### Campuses

- `POST /api/campuses` — `ADMIN`
- `PATCH /api/campuses/{id}` — `ADMIN`
- `DELETE /api/campuses/{id}` — `ADMIN`

### Buildings

- `POST /api/buildings` — `ADMIN`
- `PATCH /api/buildings/{id}` — `ADMIN`
- `DELETE /api/buildings/{id}` — `ADMIN`

### Rooms

- `POST /api/rooms` — `ADMIN`
- `PATCH /api/rooms/{id}` — `ADMIN`
- `DELETE /api/rooms/{id}` — `ADMIN`

### Room Status

- `GET /api/rooms/{id}/status` — consumer access rules
- `POST /api/rooms/{id}/status` — `STAFF`, `ADMIN`

Expected request body:

```json
{
  "status": "AVAILABLE",
  "reason": "Manual override"
}
```

### Assets

- `POST /api/rooms/{id}/assets` — `STAFF`, `ADMIN`
- `PATCH /api/rooms/{id}/assets/{assetId}` — `STAFF`, `ADMIN`
- `DELETE /api/rooms/{id}/assets/{assetId}` — `ADMIN`

### Maintenance

- `GET /api/rooms/{id}/maintenance` — `STAFF`, `ADMIN`
- `POST /api/rooms/{id}/maintenance` — `STAFF`, `ADMIN`
- `GET /api/rooms/{id}/maintenance/{logId}` — `STAFF`, `ADMIN`
- `PATCH /api/rooms/{id}/maintenance/{logId}` — `STAFF`, `ADMIN`
- `DELETE /api/rooms/{id}/maintenance/{logId}` — `ADMIN`

### Tags

- `POST /api/tags` — `ADMIN`
- `PATCH /api/tags/{id}` — `ADMIN`
- `DELETE /api/tags/{id}` — `ADMIN`

### User Roles

- `PATCH /api/admin/users/{id}/role` — `ADMIN`

## Validation Sources

- `src/lib/validations/room.schema.ts`
- `src/lib/validations/campus.schema.ts`
- `src/lib/validations/building.schema.ts`
- `src/lib/validations/asset.schema.ts`
- `src/lib/validations/maintenance.schema.ts`
- `src/lib/validations/tag.schema.ts`

## Integration Notes

- Scheduler data is read through the room timetable and availability endpoints
- The facilities module is the source of truth for campuses, buildings, rooms, tags, assets, and maintenance records
- The in-app consumer API reference is available at `/api-docs`
