import { z } from 'zod'

// Refresh status
export const RefreshStatusSchema = z.enum(['ok', 'partial', 'fail'])
export type RefreshStatus = z.infer<typeof RefreshStatusSchema>

// GitHub schemas
export const GitHubDailyStatsSchema = z.object({
  date: z.string(),
  opened: z.number(),
  closed: z.number(),
})

export const GitHubRepoDataSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  openIssuesCount: z.number(),
  issuesOpenedLast30d: z.number(),
  issuesClosedLast30d: z.number(),
  medianTimeToFirstResponseHours: z.number().nullable(),
  medianTimeToCloseHours: z.number().nullable(),
  topLabels: z.array(z.object({
    name: z.string(),
    count: z.number(),
  })),
  dailyStats: z.array(GitHubDailyStatsSchema),
  mostDiscussedIssues: z.array(z.object({
    title: z.string(),
    url: z.string(),
    comments: z.number(),
    number: z.number(),
  })),
  timeToFirstResponseDistribution: z.array(z.object({
    bucket: z.string(),
    count: z.number(),
  })),
  timeToCloseDistribution: z.array(z.object({
    bucket: z.string(),
    count: z.number(),
  })),
  fetchedAt: z.string(),
})

export const GitHubOverviewSchema = z.object({
  totalOpenIssues: z.number(),
  totalOpenedLast7d: z.number(),
  totalClosedLast7d: z.number(),
  totalOpenedLast30d: z.number(),
  totalClosedLast30d: z.number(),
  overallMedianFirstResponseHours: z.number().nullable(),
  overallMedianCloseHours: z.number().nullable(),
  repoSummaries: z.array(z.object({
    owner: z.string(),
    repo: z.string(),
    openIssues: z.number(),
    opened30d: z.number(),
    closed30d: z.number(),
  })),
  aggregatedDailyStats: z.array(GitHubDailyStatsSchema),
  fetchedAt: z.string(),
})

export type GitHubDailyStats = z.infer<typeof GitHubDailyStatsSchema>
export type GitHubRepoData = z.infer<typeof GitHubRepoDataSchema>
export type GitHubOverview = z.infer<typeof GitHubOverviewSchema>

// Discourse schemas
export const DiscourseItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  pubDate: z.string(),
  categories: z.array(z.string()).optional(),
})

export const DiscourseOverviewSchema = z.object({
  totalTopicsLast30d: z.number(),
  topicsPerWeek: z.array(z.object({
    week: z.string(),
    count: z.number(),
  })),
  keywordMatches: z.record(z.string(), z.number()),
  complaintCategoryCounts: z.record(z.string(), z.number()),
  recentItems: z.array(DiscourseItemSchema),
  fetchedAt: z.string(),
})

export type DiscourseItem = z.infer<typeof DiscourseItemSchema>
export type DiscourseOverview = z.infer<typeof DiscourseOverviewSchema>

// Reddit schemas
export const RedditPostSchema = z.object({
  title: z.string(),
  url: z.string(),
  subreddit: z.string(),
  score: z.number(),
  numComments: z.number(),
  createdUtc: z.number(),
  selftext: z.string().optional(),
  sentiment: z.number().optional(),
})

export const RedditOverviewSchema = z.object({
  available: z.boolean(),
  totalPostsLast30d: z.number(),
  averageSentiment: z.number().nullable(),
  negativeSharePercent: z.number().nullable(),
  dailySentiment: z.array(z.object({
    date: z.string(),
    avgSentiment: z.number(),
    postCount: z.number(),
  })),
  complaintCategoryCounts: z.record(z.string(), z.number()),
  topNegativeItems: z.array(z.object({
    title: z.string(),
    url: z.string(),
    subreddit: z.string(),
    sentiment: z.number(),
  })),
  fetchedAt: z.string(),
  error: z.string().optional(),
})

export type RedditPost = z.infer<typeof RedditPostSchema>
export type RedditOverview = z.infer<typeof RedditOverviewSchema>

// Community combined schema
export const CommunityOverviewSchema = z.object({
  discourse: DiscourseOverviewSchema.optional(),
  reddit: RedditOverviewSchema.optional(),
  combinedComplaintCategories: z.record(z.string(), z.number()),
  topComplaintCategory: z.string().nullable(),
  overallSentiment: z.number().nullable(),
  fetchedAt: z.string(),
})

export type CommunityOverview = z.infer<typeof CommunityOverviewSchema>

// Health score schema
export const HealthScoreSchema = z.object({
  overall: z.number(),
  components: z.object({
    responsiveness: z.object({
      score: z.number(),
      weight: z.number(),
      rawValue: z.number().nullable(),
      description: z.string(),
    }),
    closureRatio: z.object({
      score: z.number(),
      weight: z.number(),
      rawValue: z.number().nullable(),
      description: z.string(),
    }),
    communitySentiment: z.object({
      score: z.number(),
      weight: z.number(),
      rawValue: z.number().nullable(),
      available: z.boolean(),
      description: z.string(),
    }),
    complaintSeverity: z.object({
      score: z.number(),
      weight: z.number(),
      rawValue: z.number().nullable(),
      description: z.string(),
    }),
  }),
  calculatedAt: z.string(),
})

export type HealthScore = z.infer<typeof HealthScoreSchema>

// Refresh metadata
export const RefreshMetadataSchema = z.object({
  lastSuccess: z.string().nullable(),
  lastAttempt: z.string().nullable(),
  lastStatus: RefreshStatusSchema.nullable(),
  lastErrors: z.array(z.object({
    source: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })),
})

export type RefreshMetadata = z.infer<typeof RefreshMetadataSchema>

// Dashboard overview (combines all)
export const DashboardOverviewSchema = z.object({
  healthScore: HealthScoreSchema,
  github: GitHubOverviewSchema,
  community: CommunityOverviewSchema,
  refresh: RefreshMetadataSchema,
})

export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>

// Fetcher result type
export interface FetcherResult<T> {
  success: boolean
  data?: T
  error?: string
}
