'use client';

import { useMemo, useState } from 'react';
import { Code2, Server } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';

type Endpoint = {
  id: string;
  group: string;
  method: 'GET';
  path: string;
  title: string;
  details: string;
  exampleRequest: string;
  exampleResponse: string;
};

const endpoints: Endpoint[] = [
  {
    id: 'rooms-list',
    group: 'Rooms',
    method: 'GET',
    path: '/api/rooms',
    title: 'List / search rooms',
    details:
      'Room directory endpoint with optional search, status, campus, building, tag, and pagination filters.',
    exampleRequest: `GET /api/rooms?campusId=campus-north&status=AVAILABLE&page=1&limit=20`,
    exampleResponse: `{
  "data": [
    {
      "id": "cmnhlgr9y001grovs9cam5qc4",
      "roomNumber": "A100",
      "floor": 1,
      "capacity": 30,
      "roomType": "CLASSROOM",
      "description": null,
      "currentStatus": "AVAILABLE",
      "building": {
        "id": "building-a",
        "name": "Building A",
        "buildingCode": "A",
        "campus": {
          "id": "campus-north",
          "name": "North Campus",
          "address": "205 FASS College Blvd, Toronto, ON M9W 5L7"
        }
      },
      "tags": [],
      "assets": []
    }
  ],
  "total": 365,
  "page": 1,
  "limit": 20,
  "totalPages": 19
}`,
  },
  {
    id: 'room-detail',
    group: 'Rooms',
    method: 'GET',
    path: '/api/rooms/{id}',
    title: 'Get room detail',
    details:
      'Returns a single room with building, campus, tags, assets, and active maintenance context in one payload.',
    exampleRequest: `GET /api/rooms/cmnhlgr9y001grovs9cam5qc4`,
    exampleResponse: `{
  "data": {
    "id": "cmnhlgr9y001grovs9cam5qc4",
    "roomNumber": "A100",
    "floor": 1,
    "capacity": 30,
    "roomType": "CLASSROOM",
    "description": null,
    "currentStatus": "AVAILABLE",
    "archivedAt": null,
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z",
    "building": {
      "id": "building-a",
      "name": "Building A",
      "buildingCode": "A",
      "campus": {
        "id": "campus-north",
        "name": "North Campus",
        "address": "205 FASS College Blvd, Toronto, ON M9W 5L7",
        "timezone": "America/Toronto"
      }
    },
    "tags": [
      { "id": "tag-computer-lab", "tagName": "#ComputerLab", "colorCode": "#8B5CF6" }
    ],
    "assets": [
      { "id": "asset-projector", "itemName": "Projector", "quantity": 1, "isFunctional": true }
    ],
    "maintenanceLogs": []
  }
}`,
  },
  {
    id: 'room-availability',
    group: 'Rooms',
    method: 'GET',
    path: '/api/rooms/{id}/availability',
    title: 'Get room availability',
    details:
      'Returns whether the room is available right now, including the current timetable slot when the Scheduler feed is available.',
    exampleRequest: `GET /api/rooms/cmnhlgr9y001grovs9cam5qc4/availability`,
    exampleResponse: `{
  "data": {
    "roomId": "cmnhlgr9y001grovs9cam5qc4",
    "available": false,
    "reason": "OCCUPIED",
    "currentSlot": {
      "courseCode": "COMP1234",
      "courseName": "Introduction to Programming",
      "instructor": "J. Smith",
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "11:00"
    },
    "isFallback": false
  }
}`,
  },
  {
    id: 'room-timetable',
    group: 'Rooms',
    method: 'GET',
    path: '/api/rooms/{id}/timetable',
    title: 'Get room timetable',
    details:
      'Room-centric timetable bridge for downstream scheduling consumers. The Scheduler service remains the source of truth.',
    exampleRequest: `GET /api/rooms/cmnhlgr9y001grovs9cam5qc4/timetable`,
    exampleResponse: `{
  "data": {
    "roomId": "cmnhlgr9y001grovs9cam5qc4",
    "isFallback": false,
    "slots": [
      {
        "courseCode": "COMP1234",
        "courseName": "Introduction to Programming",
        "instructor": "J. Smith",
        "dayOfWeek": "Monday",
        "startTime": "09:00",
        "endTime": "11:00"
      }
    ]
  }
}`,
  },
  {
    id: 'room-assets',
    group: 'Rooms',
    method: 'GET',
    path: '/api/rooms/{id}/assets',
    title: 'Get room assets',
    details: 'Returns the tracked physical assets stored for a room.',
    exampleRequest: `GET /api/rooms/cmnhlgr9y001grovs9cam5qc4/assets`,
    exampleResponse: `{
  "data": [
    {
      "id": "asset-projector",
      "roomId": "cmnhlgr9y001grovs9cam5qc4",
      "itemName": "Projector",
      "quantity": 1,
      "isFunctional": true,
      "createdAt": "2026-04-02T10:00:00.000Z",
      "updatedAt": "2026-04-02T10:00:00.000Z"
    }
  ]
}`,
  },
  {
    id: 'buildings-list',
    group: 'Registry',
    method: 'GET',
    path: '/api/buildings',
    title: 'List all buildings',
    details: 'Returns the building registry. Consumers can scope the result client-side by campus if needed.',
    exampleRequest: `GET /api/buildings`,
    exampleResponse: `{
  "data": [
    {
      "id": "building-a",
      "name": "Building A",
      "buildingCode": "A",
      "campusId": "campus-north",
      "createdAt": "2026-04-02T10:00:00.000Z",
      "updatedAt": "2026-04-02T10:00:00.000Z"
    }
  ]
}`,
  },
  {
    id: 'building-detail',
    group: 'Registry',
    method: 'GET',
    path: '/api/buildings/{id}',
    title: 'Get building detail',
    details: 'Returns a single building record by id.',
    exampleRequest: `GET /api/buildings/building-a`,
    exampleResponse: `{
  "data": {
    "id": "building-a",
    "name": "Building A",
    "buildingCode": "A",
    "campusId": "campus-north",
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}`,
  },
  {
    id: 'campuses-list',
    group: 'Registry',
    method: 'GET',
    path: '/api/campuses',
    title: 'List all campuses',
    details: 'Returns the campus directory used by filters, maps, and dependent selectors.',
    exampleRequest: `GET /api/campuses`,
    exampleResponse: `{
  "data": [
    {
      "id": "campus-north",
      "name": "North Campus",
      "address": "205 FASS College Blvd, Toronto, ON M9W 5L7",
      "timezone": "America/Toronto"
    }
  ]
}`,
  },
  {
    id: 'campus-detail',
    group: 'Registry',
    method: 'GET',
    path: '/api/campuses/{id}',
    title: 'Get campus detail',
    details: 'Returns a single campus record by id.',
    exampleRequest: `GET /api/campuses/campus-north`,
    exampleResponse: `{
  "data": {
    "id": "campus-north",
    "name": "North Campus",
    "address": "205 FASS College Blvd, Toronto, ON M9W 5L7",
    "timezone": "America/Toronto"
  }
}`,
  },
  {
    id: 'tags-list',
    group: 'Registry',
    method: 'GET',
    path: '/api/tags',
    title: 'List all tags',
    details: 'Returns room labels such as computer labs, projector rooms, and accessibility markers.',
    exampleRequest: `GET /api/tags`,
    exampleResponse: `{
  "data": [
    {
      "id": "tag-computer-lab",
      "tagName": "#ComputerLab",
      "colorCode": "#8B5CF6",
      "createdAt": "2026-04-02T10:00:00.000Z"
    }
  ]
}`,
  },
];

export default function ApiDocsPage() {
  const [selectedId, setSelectedId] = useState(endpoints[0].id);
  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedId) ?? endpoints[0],
    [selectedId]
  );

  const groupedEndpoints = useMemo(() => {
    return endpoints.reduce<Record<string, Endpoint[]>>((groups, endpoint) => {
      groups[endpoint.group] = [...(groups[endpoint.group] ?? []), endpoint];
      return groups;
    }, {});
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full space-y-6">
          <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center rounded-full bg-[var(--fass-accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-blue)]">
                  API
                </div>
                <h1
                  className="text-3xl font-semibold text-[var(--fass-text)] sm:text-4xl"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Facilities API reference
                </h1>
                <p className="text-sm leading-6 text-[var(--fass-text-muted)]">
                  This page mirrors the consumer contract in `docs/public-api.md`. Use the deployed service for shared
                  environments and `localhost` for local development. Send the API token as
                  `Authorization: Bearer &lt;token&gt;` or `x-api-token`.
                </p>
                <div className="grid gap-2 text-sm text-[var(--fass-text)] sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Production base URL</p>
                    <code className="mt-2 block text-xs text-[var(--fass-text)]">https://fass-facilities.vercel.app</code>
                  </div>
                  <div className="rounded-2xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Local base URL</p>
                    <code className="mt-2 block text-xs text-[var(--fass-text)]">http://localhost:3000</code>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-3 text-sm text-[var(--fass-text)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Token behavior</p>
                  <p className="mt-2 leading-6">
                    Consumer `GET` endpoints require a shared API token. Clients should send the token unless they
                    already have an authenticated app session.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-3 text-sm text-[var(--fass-text)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">How to send it</p>
                  <p className="mt-2 leading-6">
                    We will provide each consumer with a shared token. They should include it on every request using
                    either `Authorization: Bearer &lt;token&gt;` or `x-api-token: &lt;token&gt;`.
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    <code>{`curl -H "Authorization: Bearer <token>" https://fass-facilities.vercel.app/api/rooms

curl -H "x-api-token: <token>" https://fass-facilities.vercel.app/api/rooms`}</code>
                  </pre>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Documented endpoints</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--fass-text)]">{endpoints.length}</p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Auth required</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--fass-text)]">Yes</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
              <div className="space-y-4">
                {Object.entries(groupedEndpoints).map(([group, items]) => (
                  <div key={group} className="space-y-2">
                    <div className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-blue)]">
                      {group}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const active = item.id === selectedEndpoint.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={`w-full rounded-[1.4rem] border px-4 py-3 text-left transition ${active
                              ? 'border-[var(--fass-blue)] bg-[color:color-mix(in_srgb,var(--fass-blue)_6%,var(--fass-bg-light))]'
                              : 'border-[var(--fass-border)] bg-[var(--fass-bg-white)] hover:border-[var(--fass-blue)]/45'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[var(--fass-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--fass-blue)]">
                                {item.method}
                              </span>
                              <span className="text-sm font-medium text-[var(--fass-text)]">{item.title}</span>
                            </div>
                            <code className="mt-2 block text-xs text-[var(--fass-text-muted)]">{item.path}</code>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--fass-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-blue)]">
                    {selectedEndpoint.method}
                  </span>
                  <h2 className="text-2xl font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {selectedEndpoint.title}
                  </h2>
                </div>
                <code className="mt-3 block rounded-2xl bg-slate-950 px-4 py-4 text-sm text-slate-100">
                  {selectedEndpoint.path}
                </code>
                <p className="mt-4 text-sm leading-6 text-[var(--fass-text-muted)]">{selectedEndpoint.details}</p>
              </section>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--fass-blue)]">
                    <Code2 className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Request example</p>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
                    <code>{selectedEndpoint.exampleRequest}</code>
                  </pre>
                </section>

                <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--fass-blue)]">
                    <Server className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Response shape</p>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
                    <code>{selectedEndpoint.exampleResponse}</code>
                  </pre>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
