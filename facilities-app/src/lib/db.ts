import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildRuntimePoolConfig } from './database-url';

// Prisma 7 uses WASM-based client engine which requires a database adapter.
// PrismaPg connects via the `pg` driver using the shared database URL and schema.
function createPrismaClient() {
  const runtimeConfig = buildRuntimePoolConfig();
  const adapter = new PrismaPg(
    { connectionString: runtimeConfig.connectionString },
    { schema: runtimeConfig.schema }
  );

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  prismaSchemaKey?: string;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;
const runtimeConfig = buildRuntimePoolConfig();

function getSchemaKey() {
  return `${runtimeConfig.connectionString}::${runtimeConfig.schema ?? 'public'}`;
}

const schemaKey = getSchemaKey();

if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma && globalForPrisma.prismaSchemaKey !== schemaKey) {
  globalForPrisma.prisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaSchemaKey = schemaKey;
}
