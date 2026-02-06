import { CONFIG, ComplaintBucket } from '@/lib/config'
import { store, KEYS } from '@/lib/store'
import { RedditOverview, RedditPost, FetcherResult } from '@/types'
import { fetchWithRetry, sleep, formatDate } from './utils'
import { analyzeSentiment, classifySentiment } from './sentiment'

interface RedditListing {
  data: {
    children: Array<{
      data: {
        title: string
        url: string
        permalink: string
        subreddit: string
        score: number
        num_comments: number
        created_utc: number
        selftext?: string
      }
    }>
    after?: string
  }
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

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  const posts: RedditPost[] = []
  let after: string | undefined

  const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60

  // Fetch multiple pages if needed
  for (let page = 0; page < 2; page++) {
    // Max 2 pages to stay conservative
    let url = `https://www.reddit.com/r/${subreddit}/new.json?limit=100`
    if (after) {
      url += `&after=${after}`
    }

    try {
      const response = await fetchWithRetry(
        url,
        {
          headers: {
            'User-Agent': 'Ubuntu-Ecosystem-Dashboard/1.0 (educational project)',
          },
        },
        CONFIG.reddit.maxRetries,
        CONFIG.reddit.requestDelayMs
      )

      if (!response.ok) {
        console.warn(
          `Reddit API returned ${response.status} for r/${subreddit}`
        )
        break
      }

      const data = (await response.json()) as RedditListing

      for (const child of data.data.children) {
        const post = child.data

        // Only include posts from last 30 days
        if (post.created_utc < thirtyDaysAgo) {
          return posts // No need to continue, posts are sorted by new
        }

        // Analyze sentiment of title + selftext
        const textToAnalyze = post.title + ' ' + (post.selftext || '')
        const sentimentResult = analyzeSentiment(textToAnalyze)

        posts.push({
          title: post.title,
          url: `https://reddit.com${post.permalink}`,
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.num_comments,
          createdUtc: post.created_utc,
          selftext: post.selftext?.slice(0, 500), // Truncate
          sentiment: sentimentResult.score,
        })
      }

      after = data.data.after
      if (!after) break

      // Respect rate limits
      await sleep(CONFIG.reddit.requestDelayMs)
    } catch (error) {
      console.warn(`Failed to fetch r/${subreddit} page ${page}:`, error)
      break
    }
  }

  return posts
}

export async function fetchRedditData(): Promise<FetcherResult<RedditOverview>> {
  try {
    const allPosts: RedditPost[] = []

    for (const subreddit of CONFIG.reddit.subreddits) {
      try {
        console.log(`Fetching Reddit r/${subreddit}...`)
        const posts = await fetchSubredditPosts(subreddit)
        allPosts.push(...posts)
        console.log(`Fetched ${posts.length} posts from r/${subreddit}`)

        // Extra delay between subreddits
        await sleep(CONFIG.reddit.requestDelayMs * 2)
      } catch (error) {
        console.warn(`Failed to fetch r/${subreddit}:`, error)
        // Continue with other subreddits
      }
    }

    if (allPosts.length === 0) {
      const overview: RedditOverview = {
        available: false,
        totalPostsLast30d: 0,
        averageSentiment: null,
        negativeSharePercent: null,
        dailySentiment: [],
        complaintCategoryCounts: {},
        topNegativeItems: [],
        fetchedAt: new Date().toISOString(),
        error: 'Failed to fetch any Reddit data',
      }

      await store.set(KEYS.REDDIT_OVERVIEW, overview)
      return { success: false, data: overview, error: overview.error }
    }

    // Calculate sentiment stats
    const sentiments = allPosts.map((p) => p.sentiment || 0)
    const averageSentiment =
      sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

    const negativePosts = allPosts.filter(
      (p) => p.sentiment !== undefined && classifySentiment(p.sentiment) === 'negative'
    )
    const negativeSharePercent =
      allPosts.length > 0
        ? (negativePosts.length / allPosts.length) * 100
        : null

    // Calculate daily sentiment
    const dailyMap = new Map<
      string,
      { totalSentiment: number; count: number }
    >()

    for (const post of allPosts) {
      const date = formatDate(new Date(post.createdUtc * 1000))
      const existing = dailyMap.get(date) || { totalSentiment: 0, count: 0 }
      existing.totalSentiment += post.sentiment || 0
      existing.count++
      dailyMap.set(date, existing)
    }

    const dailySentiment = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        avgSentiment: data.totalSentiment / data.count,
        postCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Categorize complaints
    const complaintCategoryCounts: Record<string, number> = {}
    for (const bucket of Object.keys(CONFIG.keywords.complaintBuckets)) {
      complaintCategoryCounts[bucket] = 0
    }

    for (const post of allPosts) {
      const textToCheck = post.title + ' ' + (post.selftext || '')
      const category = categorizeComplaint(textToCheck)
      if (category) {
        complaintCategoryCounts[category]++
      }
    }

    // Top negative items
    const topNegativeItems = negativePosts
      .sort((a, b) => (a.sentiment || 0) - (b.sentiment || 0))
      .slice(0, 20)
      .map((post) => ({
        title: post.title,
        url: post.url,
        subreddit: post.subreddit,
        sentiment: post.sentiment || 0,
      }))

    const overview: RedditOverview = {
      available: true,
      totalPostsLast30d: allPosts.length,
      averageSentiment,
      negativeSharePercent,
      dailySentiment,
      complaintCategoryCounts,
      topNegativeItems,
      fetchedAt: new Date().toISOString(),
    }

    await store.set(KEYS.REDDIT_OVERVIEW, overview)

    console.log(
      `Reddit: Fetched ${allPosts.length} posts, avg sentiment: ${averageSentiment?.toFixed(2)}`
    )

    return {
      success: true,
      data: overview,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Reddit fetcher error:', errorMessage)

    // Store a "not available" state
    const overview: RedditOverview = {
      available: false,
      totalPostsLast30d: 0,
      averageSentiment: null,
      negativeSharePercent: null,
      dailySentiment: [],
      complaintCategoryCounts: {},
      topNegativeItems: [],
      fetchedAt: new Date().toISOString(),
      error: errorMessage,
    }

    await store.set(KEYS.REDDIT_OVERVIEW, overview)

    return {
      success: false,
      data: overview,
      error: errorMessage,
    }
  }
}

export async function getRedditOverview(): Promise<RedditOverview | null> {
  return store.get<RedditOverview>(KEYS.REDDIT_OVERVIEW)
}
