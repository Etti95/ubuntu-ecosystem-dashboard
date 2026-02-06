import { store, KEYS } from '@/lib/store'
import { CommunityOverview, DiscourseOverview, RedditOverview } from '@/types'

export async function aggregateCommunityData(
  discourse: DiscourseOverview | null,
  reddit: RedditOverview | null
): Promise<CommunityOverview> {
  // Combine complaint categories from both sources
  const combinedComplaintCategories: Record<string, number> = {}

  if (discourse?.complaintCategoryCounts) {
    for (const [key, value] of Object.entries(
      discourse.complaintCategoryCounts
    )) {
      combinedComplaintCategories[key] =
        (combinedComplaintCategories[key] || 0) + value
    }
  }

  if (reddit?.complaintCategoryCounts) {
    for (const [key, value] of Object.entries(reddit.complaintCategoryCounts)) {
      combinedComplaintCategories[key] =
        (combinedComplaintCategories[key] || 0) + value
    }
  }

  // Find top complaint category
  let topComplaintCategory: string | null = null
  let maxCount = 0

  for (const [category, count] of Object.entries(combinedComplaintCategories)) {
    if (count > maxCount) {
      maxCount = count
      topComplaintCategory = category
    }
  }

  // Overall sentiment (only from Reddit if available)
  const overallSentiment = reddit?.available ? reddit.averageSentiment : null

  // Combine top negative items
  const topNegativeItems = [
    ...(reddit?.topNegativeItems || []).map((item) => ({
      ...item,
      source: 'reddit' as const,
    })),
  ]
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, 20)

  await store.set(KEYS.COMMUNITY_NEGATIVE_ITEMS, topNegativeItems)

  const overview: CommunityOverview = {
    discourse: discourse || undefined,
    reddit: reddit || undefined,
    combinedComplaintCategories,
    topComplaintCategory,
    overallSentiment,
    fetchedAt: new Date().toISOString(),
  }

  await store.set(KEYS.COMMUNITY_OVERVIEW, overview)

  return overview
}

export async function getCommunityOverview(): Promise<CommunityOverview | null> {
  return store.get<CommunityOverview>(KEYS.COMMUNITY_OVERVIEW)
}
