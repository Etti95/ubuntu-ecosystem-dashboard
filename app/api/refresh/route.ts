import { NextResponse } from 'next/server'
import { runRefresh } from '@/lib/refresh'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Vercel

export async function POST() {
  try {
    console.log('Manual refresh triggered')
    const result = await runRefresh()

    return NextResponse.json({
      message: 'Refresh completed',
      ...result,
    })
  } catch (error) {
    console.error('Refresh failed:', error)
    return NextResponse.json(
      {
        error: 'Refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
