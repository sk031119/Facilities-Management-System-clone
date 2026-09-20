# Facilities API Consumer Reference

Base URL:

- Production: `https://fass-facilities.vercel.app`
- Local: `http://localhost:3000`

This document covers the read-only endpoints intended for external consumers.

## Authentication

- If `FACILITIES_API_TOKEN` is not configured, consumer `GET` routes are open.
- If `FACILITIES_API_TOKEN` is configured, send either:
  - `Authorization: Bearer <token>`
  - `x-api-token: <token>`

All responses are JSON. Timestamps use ISO 8601 UTC.

## Endpoints

### `GET /api/rooms`

Returns a paginated list of rooms.

Query parameters:

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Partial room number search |
| `status` | enum | `AVAILABLE`, `OCCUPIED`, `MAINTENANCE` |
| `roomType` | enum | `CLASSROOM`, `LAB`, `LECTURE_HALL`, `OFFICE`, `COMMON_AREA`, `GYM`, `OTHER` |
| `campusId` | string | Filters rooms by campus |
| `buildingId` | string | Filters rooms by building |
| `tagId` | string | Filters rooms by tag |
| `minCapacity` | number | Minimum room capacity |
| `maxCapacity` | number | Maximum room capacity |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response shape:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0
}
```

### `GET /api/rooms/{id}`

Returns a single room with building, campus, tags, assets, and active maintenance logs.

### `GET /api/rooms/{id}/availability`

Returns the room's current availability plus timetable context when scheduler data is available.

Important fields:

- `available`
- `reason`
- `currentSlot`
- `isFallback`

### `GET /api/rooms/{id}/timetable`

Returns the weekly timetable fetched from the Scheduler integration.

Important fields:

- `roomId`
- `slots`
- `isFallback`

### `GET /api/rooms/{id}/assets`

Returns the asset list for a room.

### `GET /api/buildings`

Returns the building registry.

### `GET /api/buildings/{id}`

Returns a single building record.

### `GET /api/campuses`

Returns the campus registry.

### `GET /api/campuses/{id}`

Returns a single campus record.

### `GET /api/tags`

Returns all tags.

### `GET /api/tags/{id}`

Returns a single tag.

### `GET /api/dashboard/room-status-summary`

Returns room counts grouped by campus and as overall totals.

Response shape:

```json
{
  "data": {
    "byCampus": [],
    "totals": {
      "available": 0,
      "occupied": 0,
      "maintenance": 0,
      "total": 0
    }
  }
}
```

## Common Status Codes

- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`
- `404 Not Found`
- `500 Internal Server Error`
