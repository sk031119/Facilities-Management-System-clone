import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types';

const API_TOKEN_HEADER = 'x-api-token';
const API_TOKEN_BEARER_PREFIX = 'bearer ';

function getConfiguredApiToken() {
  const token = process.env.FACILITIES_API_TOKEN?.trim();
  return token ? token : null;
}

function getRequestApiToken(request: NextRequest) {
  const headerToken = request.headers.get(API_TOKEN_HEADER)?.trim();
  if (headerToken) return headerToken;

  const authorization = request.headers.get('authorization')?.trim();
  if (authorization?.toLowerCase().startsWith(API_TOKEN_BEARER_PREFIX)) {
    const bearerToken = authorization.slice(API_TOKEN_BEARER_PREFIX.length).trim();
    return bearerToken || null;
  }

  return null;
}

// Helper to get the current session from a Route Handler request
export async function getSession(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers });
}

// Helper: require authentication. Returns session or throws a 401 Response.
export async function requireAuth(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return { session: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}

// Helper: require a specific role. Returns session or a 401/403 Response.
export async function requireRole(request: NextRequest, ...roles: UserRole[]) {
  const { session, error } = await requireAuth(request);
  if (error) return { session: null, error };

  const userRole = (session!.user as { role?: string }).role as UserRole | undefined;
  if (!userRole || !roles.includes(userRole)) {
    return {
      session: null,
      error: Response.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session, error: null };
}

// Helper: optionally require an API token for consumer-facing routes.
// If FACILITIES_API_TOKEN is unset, the route remains open.
// If it is set, a valid token or an authenticated session is required.
export async function requireApiAccess(request: NextRequest) {
  const configuredToken = getConfiguredApiToken();
  if (!configuredToken) {
    return { session: null, error: null, tokenConfigured: false as const };
  }

  const session = await getSession(request);
  if (session) {
    return { session, error: null, tokenConfigured: true as const };
  }

  const providedToken = getRequestApiToken(request);
  if (providedToken === configuredToken) {
    return { session: null, error: null, tokenConfigured: true as const };
  }

  return {
    session: null,
    tokenConfigured: true as const,
    error: Response.json(
      {
        error: 'Unauthorized',
        message:
          'A valid API token is required. Send it with the Authorization: Bearer <token> header or x-api-token.',
      },
      { status: 401 }
    ),
  };
}

// Standard JSON error helpers
export function badRequest(message: string, details?: Record<string, string[]>) {
  return Response.json({ error: message, details }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return Response.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return Response.json({ error: message }, { status: 500 });
}
