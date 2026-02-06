import { NextResponse } from 'next/server'
import { isUsingMemoryStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasStandardUrl = !!process.env.KV_REST_API_URL
  const hasStandardToken = !!process.env.KV_REST_API_TOKEN
  const hasPrefixedUrl = !!process.env.CRON_SECRET_KV_REST_API_URL
  const hasPrefixedToken = !!process.env.CRON_SECRET_KV_REST_API_TOKEN

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    kvConfigured: {
      hasStandardUrl,
      hasStandardToken,
      hasPrefixedUrl,
      hasPrefixedToken,
      effectivelyConfigured: (hasStandardUrl && hasStandardToken) || (hasPrefixedUrl && hasPrefixedToken),
    },
    usingMemoryStore: isUsingMemoryStore(),
    message: isUsingMemoryStore()
      ? 'KV not configured - data will not persist. Add a KV database in Vercel Dashboard > Storage.'
      : 'KV configured correctly',
  })
}
