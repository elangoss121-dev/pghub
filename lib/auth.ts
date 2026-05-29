import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
const authSecret = process.env.BETTER_AUTH_SECRET

if (!databaseUrl || !authSecret) {
  console.warn('[v0] Missing database or auth configuration. The application will work offline until configured.')
}

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null

export const auth = databaseUrl && authSecret ? betterAuth({
  database: pool!,
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL || buildBaseUrl(),
  trustedOrigins: buildTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes:
      process.env.NODE_ENV === 'development'
        ? {
            sameSite: 'none',
            secure: true,
          }
        : undefined,
  },
}) : null as any

function buildBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

function buildTrustedOrigins(): string[] {
  const origins = new Set<string>()

  // Always include development origins
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')
    origins.add('http://localhost:3001')
  }

  // Add production URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  }

  // Add preview URL
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }

  // Add v0 runtime URL if present
  if (process.env.V0_RUNTIME_URL) {
    origins.add(process.env.V0_RUNTIME_URL)
  }

  return Array.from(origins)
}
