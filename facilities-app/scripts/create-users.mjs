import dotenv from 'dotenv';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

dotenv.config({ path: fs.existsSync('.env.local') ? '.env.local' : '.env' });

function normalizeDatabaseUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (url.searchParams.get('sslmode') === 'require') {
    url.searchParams.set('sslmode', 'verify-full');
  }

  return url.toString();
}

function getRuntimePoolConfig() {
  const rawUrl = process.env.DB_URL?.trim() || process.env.DATABASE_URL?.trim();
  const schema = process.env.DB_SCHEMA?.trim() || 'facilities_schema';

  if (!rawUrl) {
    throw new Error('Missing DB_URL (preferred) or DATABASE_URL in the environment.');
  }

  const connectionString = new URL(normalizeDatabaseUrl(rawUrl));
  connectionString.searchParams.set('schema', schema);

  return {
    schema,
    connectionString: connectionString.toString(),
  };
}

const runtimeConfig = getRuntimePoolConfig();
const adapter = new PrismaPg(
  { connectionString: runtimeConfig.connectionString },
  { schema: runtimeConfig.schema }
);
const db = new PrismaClient({ adapter });

async function ensureUser({ email, password, name, role }) {
  console.log(`\nEnsuring ${role} user: ${email}`);

  const passwordHash = await hashPassword(password);

  const existingUser = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  let userId = existingUser?.id;

  if (!existingUser) {
    const createdUser = await db.user.create({
      data: {
        email,
        name,
        role,
      },
      select: {
        id: true,
      },
    });

    userId = createdUser.id;
    console.log(`Created user record for ${email}.`);
  } else {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        role,
      },
    });
    console.log(`Updated user profile and role for ${email}.`);
  }

  const existingCredential = await db.account.findFirst({
    where: {
      userId,
      providerId: 'credential',
    },
    select: { id: true },
  });

  if (existingCredential) {
    await db.account.update({
      where: { id: existingCredential.id },
      data: {
        password: passwordHash,
      },
    });
    console.log(`Reset credential password for ${email}.`);
  } else {
    await db.account.create({
      data: {
        userId,
        providerId: 'credential',
        accountId: userId,
        password: passwordHash,
      },
    });
    console.log(`Created credential account for ${email}.`);
  }

  await db.session.deleteMany({
    where: { userId },
  });

  console.log(`Cleared active sessions for ${email}.`);
  console.log(`Ready: ${email} / ${password} / role=${role}`);
}

async function main() {
  console.log(`Using schema: ${runtimeConfig.schema}`);

  await ensureUser({
    email: 'admin@fass.ca',
    password: 'password123',
    name: 'Admin User',
    role: 'ADMIN',
  });

  await ensureUser({
    email: 'staff@fass.ca',
    password: 'password123',
    name: 'Staff User',
    role: 'STAFF',
  });
}

main()
  .catch((error) => {
    console.error('\nUser bootstrap failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
