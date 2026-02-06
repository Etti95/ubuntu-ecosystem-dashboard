import { NextResponse } from 'next/server'
import { runRefresh } from '@/lib/refresh'
import { isUsingMemoryStore } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Vercel

export async function POST() {
  try {
    const usingMemory = isUsingMemoryStore()
    console.log('Manual refresh triggered')
    console.log('Using memory store:', usingMemory)
    console.log('KV_REST_API_URL configured:', !!process.env.KV_REST_API_URL)

    if (usingMemory) {
      console.warn('WARNING: Using in-memory store. Data will not persist between requests on serverless.')
    }

    const result = await runRefresh()

    return NextResponse.json({
      message: 'Refresh completed',
      usingMemoryStore: usingMemory,
      ...result,
    })
  } catch (error) {
    console.error('Refresh failed:', error)
    return NextResponse.json(
      {
        error: 'Refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
