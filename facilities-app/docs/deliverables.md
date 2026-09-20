# Deliverables

## Deliverable Mapping

| Requirement | Location |
|---|---|
| Project overview and setup | `README.md` |
| Public API documentation | `docs/public-api.md` |
| Internal API specification | `docs/api_spec.md` |
| Role-based access rules | `docs/role_access.md` |
| UI architecture | `docs/ui_architecture.md` |
| Data flow | `docs/data_flow.md` |
| Database schema | `prisma/schema.prisma` |
| API route handlers | `src/app/api/` |
| Validation logic | `src/lib/validations/` |
| Public pages | `src/app/page.tsx`, `src/app/rooms/[id]/page.tsx`, `src/app/campuses/page.tsx` |
| Admin pages | `src/app/admin/` |

## Local Review Checklist

1. Install dependencies with `npm install`
2. Configure `.env` from `.env.example`
3. Run `npx prisma db push`
4. Run `npx prisma generate`
5. Start the app with `npm run dev`

Optional:

- Load sample data with `npx prisma db seed`
- Create local test users with `npx tsx scripts/create-users.mjs`
