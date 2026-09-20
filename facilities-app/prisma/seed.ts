// Seed script for the Facilities module
// Requirements:
//   - Creates campuses, buildings, and rooms from four data files:
//       ../../data/rooms.json                  → North Campus
//       ../../data/lakeshore_campus_rooms.json → Lakeshore Campus
//       ../../data/u_of_gh_rooms.json          → University of Guelph-FASS (own campus)
//       ../../data/igh.json                    → International Graduate School campus
//   - Room numbers are parsed for floor (first digit of numeric part)
//   - Descriptions are extracted from parenthetical suffixes "A107 (Massage Therapy)"
//     or dash-separated suffixes "AN105 - Court of Justice"
//   - Uses upsert so script is safe to re-run
// Run: npx tsx prisma/seed.ts (after DB_URL / DB_SCHEMA are set in .env)

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildRuntimePoolConfig } from '../src/lib/database-url';

const runtimeConfig = buildRuntimePoolConfig();
const adapter = new PrismaPg(
  { connectionString: runtimeConfig.connectionString },
  { schema: runtimeConfig.schema }
);
const db = new PrismaClient({ adapter });

// Extract building code from building name:
// "Building A" → "A", "CTI Building" → "CTI", "LX Building" → "LX"
function buildingCode(name: string): string {
  const prefixMatch = name.match(/^Building\s+(\S+)$/i);
  if (prefixMatch) return prefixMatch[1];
  const suffixMatch = name.match(/^(\S+)\s+Building$/i);
  if (suffixMatch) return suffixMatch[1];
  return name;
}

// Extract floor from room number — first digit of the numeric part
// "A100" → 1, "CTI108" → 1, "LRC3057" → 3, "JF102" → 1
function extractFloor(roomNumber: string): number {
  const digits = roomNumber.match(/\d/);
  return digits ? parseInt(digits[0], 10) : 1;
}

// Parse room strings in two formats:
//   "A107 (Massage Therapy)"   → { roomNumber: "A107", description: "Massage Therapy" }
//   "AN105 - Court of Justice" → { roomNumber: "AN105", description: "Court of Justice" }
function parseRoom(raw: string): { roomNumber: string; description: string | null } {
  const parenMatch = raw.match(/^(\S+)\s+\((.+)\)$/);
  if (parenMatch) return { roomNumber: parenMatch[1], description: parenMatch[2] };
  const dashMatch = raw.match(/^(\S+)\s+-\s+(.+)$/);
  if (dashMatch) return { roomNumber: dashMatch[1], description: dashMatch[2] };
  return { roomNumber: raw.trim(), description: null };
}

async function main() {
  console.log('🌱 Seeding Facilities database...');

  // ─── Tags ───────────────────────────────────────────────────────────────────
  const tags = await Promise.all([
    db.tag.upsert({ where: { tagName: '#MathLab' }, update: {}, create: { tagName: '#MathLab', colorCode: '#007ACC' } }),
    db.tag.upsert({ where: { tagName: '#ComputerLab' }, update: {}, create: { tagName: '#ComputerLab', colorCode: '#8B5CF6' } }),
    db.tag.upsert({ where: { tagName: '#QuietStudy' }, update: {}, create: { tagName: '#QuietStudy', colorCode: '#22C55E' } }),
    db.tag.upsert({ where: { tagName: '#Projector' }, update: {}, create: { tagName: '#Projector', colorCode: '#F59E0B' } }),
    db.tag.upsert({ where: { tagName: '#Accessible' }, update: {}, create: { tagName: '#Accessible', colorCode: '#EF4444' } }),
  ]);
  console.log(`  ✓ ${tags.length} tags`);

  // ─── Campuses ────────────────────────────────────────────────────────────────
  const north = await db.campus.upsert({
    where: { id: 'campus-north' },
    update: {},
    create: { id: 'campus-north', name: 'North Campus', address: '205 FASS College Blvd, Toronto, ON M9W 5L7', timezone: 'America/Toronto' },
  });

  const lakeshore = await db.campus.upsert({
    where: { id: 'campus-lakeshore' },
    update: {},
    create: { id: 'campus-lakeshore', name: 'Lakeshore Campus', address: '3199 Lake Shore Blvd W, Toronto, ON M8V 1K8', timezone: 'America/Toronto' },
  });

  const igc = await db.campus.upsert({
    where: { id: 'campus-igc' },
    update: {},
    create: { id: 'campus-igc', name: 'International Graduate School', address: '59 Stormont Ave, Toronto, ON', timezone: 'America/Toronto' },
  });

  const guelphFASS = await db.campus.upsert({
    where: { id: 'campus-gh' },
    update: {},
    create: { id: 'campus-gh', name: 'University of Guelph-FASS', address: '207 FASS College Blvd, Toronto, ON M9W 5L7', timezone: 'America/Toronto' },
  });

  console.log('  ✓ 4 campuses');

  // Each entry maps a JSON data file to the campus it belongs to.
  // For files with a single top-level key (igh.json, u_of_gh_rooms.json),
  // that key becomes the building name within the campus.
  const dataSets: Array<{ file: string; campusId: string }> = [
    { file: 'rooms.json', campusId: north.id },
    { file: 'lakeshore_campus_rooms.json', campusId: lakeshore.id },
    { file: 'u_of_gh_rooms.json', campusId: guelphFASS.id },
    { file: 'igh.json', campusId: igc.id },
  ];

  let buildingCount = 0;
  let roomCount = 0;

  for (const { file, campusId } of dataSets) {
    const filePath = path.join(__dirname, '..', '..', 'data', file);
    const data: Record<string, string[]> = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const [buildingName, roomList] of Object.entries(data)) {
      const code = buildingCode(buildingName);

      const building = await db.building.upsert({
        where: { buildingCode: code },
        update: {},
        create: { campusId, name: buildingName, buildingCode: code },
      });
      buildingCount++;

      // Deduplicate room numbers within this building before inserting
      const seen = new Set<string>();
      const roomsToCreate = roomList
        .map((raw) => parseRoom(raw))
        .filter(({ roomNumber }) => {
          if (seen.has(roomNumber)) return false;
          seen.add(roomNumber);
          return true;
        })
        .map(({ roomNumber, description }) => ({
          buildingId: building.id,
          roomNumber,
          floor: extractFloor(roomNumber),
          capacity: 30,
          description,
        }));

      const result = await db.room.createMany({
        data: roomsToCreate,
        skipDuplicates: true,
      });
      roomCount += result.count;

      // Seed initial status history for newly created rooms
      if (result.count > 0) {
        const newRooms = await db.room.findMany({
          where: { buildingId: building.id },
          select: { id: true },
        });
        await db.roomStatusHistory.createMany({
          data: newRooms.map((r) => ({ roomId: r.id, status: 'AVAILABLE' as const })),
          skipDuplicates: true,
        });
      }
    }
  }

  console.log(`  ✓ ${buildingCount} buildings`);
  console.log(`  ✓ ${roomCount} rooms created`);

  // ─── Admin user note ─────────────────────────────────────────────────────────
  console.log('\n⚠️  To create an admin account, use the Better-Auth sign-up endpoint,');
  console.log('   then manually set role=ADMIN in the users table:');
  console.log("   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@fass.ca';");
  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
