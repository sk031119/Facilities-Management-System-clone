import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';

function getUrlHost(value: string | undefined) {
  if (!value) return undefined;

  try {
    return new URL(value).host;
  } catch {
    return undefined;
  }
}

const configuredBaseUrl = process.env.BETTER_AUTH_URL;
const allowedHosts = [
  'localhost:3000',
  '127.0.0.1:3000',
  '*.vercel.app',
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  getUrlHost(configuredBaseUrl),
].filter((host): host is string => Boolean(host));

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  baseURL: configuredBaseUrl ?? {
    protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
    allowedHosts,
  },
  secret: process.env.BETTER_AUTH_SECRET ?? 'fallback-dev-secret',
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // refresh session if older than 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'PUBLIC',
        input: false, // users cannot set their own role
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
