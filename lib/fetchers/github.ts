import { CONFIG } from '@/lib/config'
import { store, KEYS } from '@/lib/store'
import {
  GitHubRepoData,
  GitHubOverview,
  GitHubDailyStats,
  FetcherResult,
} from '@/types'
import { fetchWithRetry, sleep, formatDate, getDaysBetween, median } from './utils'

const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  state: string
  created_at: string
  closed_at: string | null
  comments: number
  labels: Array<{ name: string }>
  pull_request?: unknown
}

interface GitHubComment {
  created_at: string
  user: { login: string }
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Ubuntu-Ecosystem-Dashboard',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function fetchAllIssues(
  owner: string,
  repo: string,
  since: Date
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues`)
    url.searchParams.set('state', 'all')
    url.searchParams.set('since', since.toISOString())
    url.searchParams.set('per_page', perPage.toString())
    url.searchParams.set('page', page.toString())
    url.searchParams.set('sort', 'created')
    url.searchParams.set('direction', 'desc')

    const response = await fetchWithRetry(url.toString(), {
      headers: getHeaders(),
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Repository ${owner}/${repo} not found`)
        return []
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = (await response.json()) as GitHubIssue[]

    // Filter out pull requests (GitHub includes PRs in issues endpoint)
    const actualIssues = data.filter((issue) => !issue.pull_request)
    issues.push(...actualIssues)

    // Check if we have more pages
    const linkHeader = response.headers.get('Link')
    if (!linkHeader || !linkHeader.includes('rel="next"')) {
      break
    }

    page++
    await sleep(CONFIG.github.requestDelayMs)
  }

  return issues
}

async function fetchFirstComment(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubComment | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=1`

  try {
    const response = await fetchWithRetry(url, { headers: getHeaders() })
    if (!response.ok) return null

    const comments = (await response.json()) as GitHubComment[]
    return comments[0] || null
  } catch {
    return null
  }
}

async function fetchRepoData(
  owner: string,
  repo: string
): Promise<GitHubRepoData> {
  const since = new Date()
  since.setDate(since.getDate() - CONFIG.github.lookbackDays)

  console.log(`Fetching issues for ${owner}/${repo}...`)
  const issues = await fetchAllIssues(owner, repo, since)

  // Get current open issues count
  const repoUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}`
  const repoResponse = await fetchWithRetry(repoUrl, { headers: getHeaders() })
  const repoInfo = await repoResponse.json()
  const openIssuesCount = repoInfo.open_issues_count || 0

  // Filter issues by date range
  const issuesInRange = issues.filter((issue) => {
    const createdAt = new Date(issue.created_at)
    return createdAt >= since
  })

  // Calculate daily stats
  const dailyStatsMap = new Map<string, { opened: number; closed: number }>()
  const days = getDaysBetween(since, new Date())

  for (const day of days) {
    dailyStatsMap.set(day, { opened: 0, closed: 0 })
  }

  for (const issue of issuesInRange) {
    const createdDate = formatDate(new Date(issue.created_at))
    if (dailyStatsMap.has(createdDate)) {
      const stats = dailyStatsMap.get(createdDate)!
      stats.opened++
    }

    if (issue.closed_at) {
      const closedDate = formatDate(new Date(issue.closed_at))
      if (dailyStatsMap.has(closedDate)) {
        const stats = dailyStatsMap.get(closedDate)!
        stats.closed++
      }
    }
  }

  const dailyStats: GitHubDailyStats[] = Array.from(dailyStatsMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate totals
  const issuesOpenedLast30d = issuesInRange.length
  const issuesClosedLast30d = issuesInRange.filter((i) => i.closed_at).length

  // Calculate label counts
  const labelCounts = new Map<string, number>()
  for (const issue of issuesInRange) {
    for (const label of issue.labels) {
      labelCounts.set(label.name, (labelCounts.get(label.name) || 0) + 1)
    }
  }

  const topLabels = Array.from(labelCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Get most discussed issues
  const mostDiscussedIssues = issuesInRange
    .sort((a, b) => b.comments - a.comments)
    .slice(0, 10)
    .map((issue) => ({
      title: issue.title,
      url: issue.html_url,
      comments: issue.comments,
      number: issue.number,
    }))

  // Calculate time-to-first-response for a sample of issues
  const timeToFirstResponseHours: number[] = []
  const sampleIssues = issuesInRange
    .filter((i) => i.comments > 0)
    .slice(0, 20) // Sample for performance

  for (const issue of sampleIssues) {
    await sleep(CONFIG.github.requestDelayMs)
    const firstComment = await fetchFirstComment(owner, repo, issue.number)
    if (firstComment) {
      const issueCreated = new Date(issue.created_at)
      const commentCreated = new Date(firstComment.created_at)
      const diffHours =
        (commentCreated.getTime() - issueCreated.getTime()) / (1000 * 60 * 60)
      if (diffHours >= 0) {
        timeToFirstResponseHours.push(diffHours)
      }
    }
  }

  // Calculate time-to-close
  const timeToCloseHours: number[] = []
  for (const issue of issuesInRange.filter((i) => i.closed_at)) {
    const created = new Date(issue.created_at)
    const closed = new Date(issue.closed_at!)
    const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
    if (diffHours >= 0) {
      timeToCloseHours.push(diffHours)
    }
  }

  // Create bucketed distributions
  const responseBuckets = [
    { label: '<1h', max: 1 },
    { label: '1-4h', max: 4 },
    { label: '4-24h', max: 24 },
    { label: '1-3d', max: 72 },
    { label: '3-7d', max: 168 },
    { label: '>7d', max: Infinity },
  ]

  const closeBuckets = [
    { label: '<1d', max: 24 },
    { label: '1-3d', max: 72 },
    { label: '3-7d', max: 168 },
    { label: '1-2w', max: 336 },
    { label: '2-4w', max: 672 },
    { label: '>4w', max: Infinity },
  ]

  function bucketize(
    values: number[],
    buckets: { label: string; max: number }[]
  ) {
    const result = buckets.map((b) => ({ bucket: b.label, count: 0 }))
    for (const value of values) {
      for (let i = 0; i < buckets.length; i++) {
        if (value < buckets[i].max) {
          result[i].count++
          break
        }
      }
    }
    return result
  }

  return {
    owner,
    repo,
    openIssuesCount,
    issuesOpenedLast30d,
    issuesClosedLast30d,
    medianTimeToFirstResponseHours: median(timeToFirstResponseHours),
    medianTimeToCloseHours: median(timeToCloseHours),
    topLabels,
    dailyStats,
    mostDiscussedIssues,
    timeToFirstResponseDistribution: bucketize(
      timeToFirstResponseHours,
      responseBuckets
    ),
    timeToCloseDistribution: bucketize(timeToCloseHours, closeBuckets),
    fetchedAt: new Date().toISOString(),
  }
}

function aggregateRepoData(repos: GitHubRepoData[]): GitHubOverview {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = formatDate(sevenDaysAgo)

  // Aggregate daily stats
  const aggregatedDailyMap = new Map<string, { opened: number; closed: number }>()

  for (const repo of repos) {
    for (const stat of repo.dailyStats) {
      const existing = aggregatedDailyMap.get(stat.date) || {
        opened: 0,
        closed: 0,
      }
      existing.opened += stat.opened
      existing.closed += stat.closed
      aggregatedDailyMap.set(stat.date, existing)
    }
  }

  const aggregatedDailyStats: GitHubDailyStats[] = Array.from(
    aggregatedDailyMap.entries()
  )
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate 7-day totals
  const last7dStats = aggregatedDailyStats.filter(
    (s) => s.date >= sevenDaysAgoStr
  )
  const totalOpenedLast7d = last7dStats.reduce((sum, s) => sum + s.opened, 0)
  const totalClosedLast7d = last7dStats.reduce((sum, s) => sum + s.closed, 0)

  // Collect all response times for overall median
  const allResponseTimes: number[] = []
  const allCloseTimes: number[] = []

  for (const repo of repos) {
    if (repo.medianTimeToFirstResponseHours !== null) {
      allResponseTimes.push(repo.medianTimeToFirstResponseHours)
    }
    if (repo.medianTimeToCloseHours !== null) {
      allCloseTimes.push(repo.medianTimeToCloseHours)
    }
  }

  return {
    totalOpenIssues: repos.reduce((sum, r) => sum + r.openIssuesCount, 0),
    totalOpenedLast7d,
    totalClosedLast7d,
    totalOpenedLast30d: repos.reduce((sum, r) => sum + r.issuesOpenedLast30d, 0),
    totalClosedLast30d: repos.reduce((sum, r) => sum + r.issuesClosedLast30d, 0),
    overallMedianFirstResponseHours: median(allResponseTimes),
    overallMedianCloseHours: median(allCloseTimes),
    repoSummaries: repos.map((r) => ({
      owner: r.owner,
      repo: r.repo,
      openIssues: r.openIssuesCount,
      opened30d: r.issuesOpenedLast30d,
      closed30d: r.issuesClosedLast30d,
    })),
    aggregatedDailyStats,
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchGitHubData(): Promise<FetcherResult<GitHubOverview>> {
  try {
    const repoDataList: GitHubRepoData[] = []

    for (const { owner, repo } of CONFIG.github.repos) {
      try {
        const repoData = await fetchRepoData(owner, repo)
        repoDataList.push(repoData)

        // Store individual repo data
        await store.set(KEYS.GITHUB_REPO(owner, repo), repoData)

        console.log(
          `Fetched ${owner}/${repo}: ${repoData.issuesOpenedLast30d} issues opened in last 30d`
        )
      } catch (error) {
        console.error(`Failed to fetch ${owner}/${repo}:`, error)
        // Continue with other repos
      }

      await sleep(CONFIG.github.requestDelayMs)
    }

    if (repoDataList.length === 0) {
      return {
        success: false,
        error: 'Failed to fetch any GitHub repositories',
      }
    }

    const overview = aggregateRepoData(repoDataList)
    await store.set(KEYS.GITHUB_OVERVIEW, overview)

    return {
      success: true,
      data: overview,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('GitHub fetcher error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function getGitHubOverview(): Promise<GitHubOverview | null> {
  return store.get<GitHubOverview>(KEYS.GITHUB_OVERVIEW)
}

export async function getGitHubRepoData(
  owner: string,
  repo: string
): Promise<GitHubRepoData | null> {
  return store.get<GitHubRepoData>(KEYS.GITHUB_REPO(owner, repo))
}
