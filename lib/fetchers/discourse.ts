import { CONFIG, ComplaintBucket } from '@/lib/config'
import { store, KEYS } from '@/lib/store'
import { DiscourseOverview, DiscourseItem, FetcherResult } from '@/types'
import { fetchWithRetry, formatDate } from './utils'

interface RSSItem {
  title?: string
  link?: string
  pubDate?: string
  categories?: string[]
  content?: string
  contentSnippet?: string
}

interface RSSFeed {
  items: RSSItem[]
}

// Simple RSS parser (to avoid heavy dependencies)
async function parseRSS(url: string): Promise<RSSFeed> {
  const response = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'Ubuntu-Ecosystem-Dashboard',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status}`)
  }

  const text = await response.text()
  const items: RSSItem[] = []

  // Simple regex-based XML parsing
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(text)) !== null) {
    const itemXml = match[1]

    const getTagContent = (tag: string): string | undefined => {
      const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
      const tagMatch = tagRegex.exec(itemXml)
      return tagMatch ? (tagMatch[1] || tagMatch[2] || '').trim() : undefined
    }

    const getCategories = (): string[] => {
      const cats: string[] = []
      const catRegex = /<category[^>]*><!?\[?C?D?A?T?A?\[?([^\]<]*)\]?\]?<\/category>/g
      let catMatch
      while ((catMatch = catRegex.exec(itemXml)) !== null) {
        cats.push(catMatch[1].trim())
      }
      return cats
    }

    items.push({
      title: getTagContent('title'),
      link: getTagContent('link'),
      pubDate: getTagContent('pubDate'),
      categories: getCategories(),
      content: getTagContent('description') || getTagContent('content:encoded'),
    })
  }

  return { items }
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase()
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
}

function categorizeComplaint(text: string): ComplaintBucket | null {
  const lowerText = text.toLowerCase()
  const buckets = CONFIG.keywords.complaintBuckets

  for (const [bucket, keywords] of Object.entries(buckets)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return bucket as ComplaintBucket
    }
  }

  return null
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
  d.setDate(diff)
  return formatDate(d)
}

export async function fetchDiscourseData(): Promise<FetcherResult<DiscourseOverview>> {
  try {
    const allItems: DiscourseItem[] = []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - CONFIG.discourse.lookbackDays)

    for (const feed of CONFIG.discourse.feeds) {
      try {
        console.log(`Fetching Discourse RSS: ${feed.name}...`)
        const rss = await parseRSS(feed.url)

        for (const item of rss.items) {
          if (!item.title || !item.link) continue

          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()

          // Only include items from last 30 days
          if (pubDate < thirtyDaysAgo) continue

          allItems.push({
            title: item.title,
            link: item.link,
            pubDate: pubDate.toISOString(),
            categories: item.categories,
          })
        }
      } catch (error) {
        console.error(`Failed to fetch ${feed.name}:`, error)
        // Continue with other feeds
      }
    }

    // Remove duplicates by link
    const uniqueItems = Array.from(
      new Map(allItems.map((item) => [item.link, item])).values()
    )

    // Calculate weekly counts
    const weeklyCountsMap = new Map<string, number>()
    for (const item of uniqueItems) {
      const weekStart = getWeekStart(new Date(item.pubDate))
      weeklyCountsMap.set(weekStart, (weeklyCountsMap.get(weekStart) || 0) + 1)
    }

    const topicsPerWeek = Array.from(weeklyCountsMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Match keywords
    const keywordMatches: Record<string, number> = {}
    for (const keyword of CONFIG.keywords.general) {
      keywordMatches[keyword] = 0
    }

    for (const item of uniqueItems) {
      const textToCheck = item.title + ' ' + (item.categories?.join(' ') || '')
      for (const keyword of CONFIG.keywords.general) {
        if (matchesKeywords(textToCheck, [keyword])) {
          keywordMatches[keyword]++
        }
      }
    }

    // Categorize complaints
    const complaintCategoryCounts: Record<string, number> = {}
    for (const bucket of Object.keys(CONFIG.keywords.complaintBuckets)) {
      complaintCategoryCounts[bucket] = 0
    }

    for (const item of uniqueItems) {
      const textToCheck = item.title + ' ' + (item.categories?.join(' ') || '')
      const category = categorizeComplaint(textToCheck)
      if (category) {
        complaintCategoryCounts[category]++
      }
    }

    const overview: DiscourseOverview = {
      totalTopicsLast30d: uniqueItems.length,
      topicsPerWeek,
      keywordMatches,
      complaintCategoryCounts,
      recentItems: uniqueItems.slice(0, 20), // Keep top 20 recent items
      fetchedAt: new Date().toISOString(),
    }

    await store.set(KEYS.DISCOURSE_OVERVIEW, overview)

    console.log(
      `Discourse: Fetched ${uniqueItems.length} topics from last 30 days`
    )

    return {
      success: true,
      data: overview,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Discourse fetcher error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function getDiscourseOverview(): Promise<DiscourseOverview | null> {
  return store.get<DiscourseOverview>(KEYS.DISCOURSE_OVERVIEW)
}
