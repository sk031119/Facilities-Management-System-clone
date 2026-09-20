# Role Access Rules

The application uses three roles:

- `PUBLIC`
- `STAFF`
- `ADMIN`

`PUBLIC` is the read-only role used for unaudited or newly registered users.

## Where Access Is Enforced

- `src/proxy.ts` protects `/admin` page routes
- `src/lib/api-helpers.ts` protects API routes with `requireAuth()`, `requireRole()`, and `requireApiAccess()`

## Page Access

| Route Area | `PUBLIC` | `STAFF` | `ADMIN` |
|---|---|---|---|
| `/` room browser | Yes | Yes | Yes |
| `/rooms/[id]` room details | Yes | Yes | Yes |
| `/campuses` campus explorer | Yes | Yes | Yes |
| `/admin` dashboard | No | Yes | Yes |
| `/admin/campuses` | No | Yes | Yes |
| `/admin/maintenance` | No | Yes | Yes |
| `/admin/tags` | No | Yes | Yes |
| `/admin/rooms` | No | No | Yes |
| `/admin/buildings` | No | No | Yes |
| `/admin/users` | No | No | Yes |

## API Access

### Consumer `GET` endpoints

- Open when `FACILITIES_API_TOKEN` is not configured
- Require API token or authenticated session when `FACILITIES_API_TOKEN` is configured

### Protected write endpoints

| Action Area | `PUBLIC` | `STAFF` | `ADMIN` |
|---|---|---|---|
| Create, update, delete campuses | No | No | Yes |
| Create, update, delete buildings | No | No | Yes |
| Create, update, delete rooms | No | No | Yes |
| Update room status | No | Yes | Yes |
| Create or update room assets | No | Yes | Yes |
| Delete room assets | No | No | Yes |
| Create or update maintenance logs | No | Yes | Yes |
| Delete maintenance logs | No | No | Yes |
| Create, update, delete tags | No | No | Yes |
| Change user roles | No | No | Yes |

## Registration Notes

- Self-registration is available at `/signup`
- New users are created with the `PUBLIC` role
- Elevated permissions must be assigned by an admin
