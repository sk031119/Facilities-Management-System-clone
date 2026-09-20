# Data Flow

This document summarizes how data moves through the Facilities Management module.

## Main Request Flow

```text
Page or form -> API route or server query -> Zod validation -> Prisma -> PostgreSQL -> JSON or rendered UI
```

## Read Flow

1. A page loads through a Next.js Server Component.
2. The page reads data from Prisma directly, or calls a supporting integration such as the scheduler helper.
3. The server returns rendered HTML to the client.
4. Client Components receive the initial data and handle filters or local interactions.

Examples:

- `/` loads rooms, campuses, buildings, tags, and summary counts
- `/rooms/[id]` loads room details from Prisma and timetable data from the scheduler integration
- `/campuses` loads campuses with nested buildings and rooms
- `/admin/*` pages load management data on the server before rendering tables and dialogs

## Write Flow

1. A user submits a form from an admin page.
2. The client sends a request to an API route.
3. The route checks authentication or role requirements.
4. The request body is validated with Zod.
5. Prisma writes the data to PostgreSQL.
6. The route returns JSON for the updated record or a success message.
7. The client updates the table or detail view.

Examples:

- room creation and updates from `/admin/rooms`
- campus and building maintenance from `/admin/campuses` and `/admin/buildings`
- maintenance issue reporting and resolution from `/admin/maintenance`
- role updates from `/admin/users`

## Access Control Flow

- `/admin` page access is checked in `src/proxy.ts`
- API route access is checked in `src/lib/api-helpers.ts`
- Consumer `GET` routes use API-token-based access when configured
- Write routes require authenticated users with the correct role

## Error Paths

- Invalid request data returns `400`
- Missing authentication returns `401`
- Missing permissions return `403`
- Missing records return `404`
- Unexpected server or database failures return `500`

## Integration Flow

- Room availability and timetable data rely on the scheduler integration in `src/lib/scheduler.ts`
- Facility records remain stored in the Facilities database through Prisma
- Scheduler requests return a fallback timetable shape when the external service is unavailable or times out
- Campus address lookup uses Nominatim in the campus form to suggest Canadian addresses and fill map coordinates
