import { NextResponse } from 'next/server'
import { getCommunityOverview } from '@/lib/aggregations/community'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const community = await getCommunityOverview()

    if (!community) {
      return NextResponse.json(
        { error: 'Community data not found. Try refreshing.' },
        { status: 404 }
      )
    }

    return NextResponse.json(community)
  } catch (error) {
    console.error('Error fetching community data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community data' },
      { status: 500 }
    )
  }
}
