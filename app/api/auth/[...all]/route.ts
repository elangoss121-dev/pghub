export const dynamic = 'force-dynamic'

// Lazy load auth to avoid database connection at build time
async function getAuthHandlers() {
  const { auth } = await import('@/lib/auth')
  const { toNextJsHandler } = await import('better-auth/next-js')
  return toNextJsHandler(auth.handler)
}

export async function GET(req: Request) {
  const handlers = await getAuthHandlers()
  return handlers.GET(req)
}

export async function POST(req: Request) {
  const handlers = await getAuthHandlers()
  return handlers.POST(req)
}
