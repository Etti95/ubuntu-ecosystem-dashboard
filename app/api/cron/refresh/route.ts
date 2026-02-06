import { NextRequest, NextResponse } from 'next/server'
import { runRefresh } from '@/lib/refresh'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    // If no CRON_SECRET is set, log a warning but allow in development
    if (process.env.NODE_ENV === 'production') {
      console.warn('CRON_SECRET not configured, rejecting request')
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }
  }

  try {
    console.log('Cron refresh triggered')
    const result = await runRefresh()

    return NextResponse.json({
      message: 'Cron refresh completed',
      ...result,
    })
  } catch (error) {
    console.error('Cron refresh failed:', error)
    return NextResponse.json(
      {
        error: 'Cron refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
