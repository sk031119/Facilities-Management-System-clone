type RuntimePoolConfig = {
  connectionString: string;
  schema?: string;
};

function normalizeDatabaseUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sslMode = url.searchParams.get('sslmode');

  // `pg` now warns when `sslmode=require` is used because it will change semantics
  // in a future major release. We opt into the stricter behavior explicitly.
  if (sslMode === 'require') {
    url.searchParams.set('sslmode', 'verify-full');
  }

  return url.toString();
}

export function getPrimaryDatabaseUrl() {
  const rawUrl = process.env.DB_URL?.trim() || process.env.DATABASE_URL?.trim() || undefined;
  return rawUrl ? normalizeDatabaseUrl(rawUrl) : undefined;
}

export function getDatabaseSchema() {
  return process.env.DB_SCHEMA?.trim() || undefined;
}

export function buildPrismaDatabaseUrl(
  rawUrl: string | undefined = getPrimaryDatabaseUrl(),
  schema: string | undefined = getDatabaseSchema()
) {
  if (!rawUrl) return undefined;
  if (!schema) return normalizeDatabaseUrl(rawUrl);

  const url = new URL(normalizeDatabaseUrl(rawUrl));
  url.searchParams.set('schema', schema);
  return url.toString();
}

export function buildRuntimePoolConfig(
  rawUrl: string | undefined = getPrimaryDatabaseUrl(),
  schema: string | undefined = getDatabaseSchema()
): RuntimePoolConfig {
  if (!rawUrl) {
    throw new Error('Missing DB_URL (preferred) or DATABASE_URL in the environment.');
  }

  return {
    connectionString: buildPrismaDatabaseUrl(rawUrl, schema) ?? normalizeDatabaseUrl(rawUrl),
    schema,
  };
}
