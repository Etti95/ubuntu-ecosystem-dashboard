import { NextResponse } from 'next/server'
import { isUsingMemoryStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    kvConfigured: {
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN,
    },
    usingMemoryStore: isUsingMemoryStore(),
    message: isUsingMemoryStore()
      ? 'KV not configured - data will not persist. Add a KV database in Vercel Dashboard > Storage.'
      : 'KV configured correctly',
  })
}
