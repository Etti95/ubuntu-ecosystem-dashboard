import { DashboardOverview } from '@/types'
import { getGitHubOverview } from '@/lib/fetchers/github'
import { getCommunityOverview } from '@/lib/aggregations/community'
import { getHealthScore } from '@/lib/scoring/healthScore'
import { getRefreshMetadata } from '@/lib/refresh'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData(): Promise<Partial<DashboardOverview>> {
  const [healthScore, github, community, refresh] = await Promise.all([
    getHealthScore(),
    getGitHubOverview(),
    getCommunityOverview(),
    getRefreshMetadata(),
  ])

  return {
    healthScore: healthScore || undefined,
    github: github || undefined,
    community: community || undefined,
    refresh,
  }
}

export default async function OverviewPage() {
  const data = await getDashboardData()

  return <OverviewClient initialData={data} />
}
