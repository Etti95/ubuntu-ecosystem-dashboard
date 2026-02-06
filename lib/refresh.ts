import { store, KEYS } from '@/lib/store'
import { fetchGitHubData, getGitHubOverview } from '@/lib/fetchers/github'
import { fetchDiscourseData, getDiscourseOverview } from '@/lib/fetchers/discourse'
import { fetchRedditData, getRedditOverview } from '@/lib/fetchers/reddit'
import { aggregateCommunityData } from '@/lib/aggregations/community'
import { calculateHealthScore } from '@/lib/scoring/healthScore'
import { RefreshStatus, RefreshMetadata } from '@/types'

interface RefreshError {
  source: string
  error: string
  timestamp: string
}

export interface RefreshResult {
  status: RefreshStatus
  errors: RefreshError[]
  duration: number
}

export async function runRefresh(): Promise<RefreshResult> {
  const startTime = Date.now()
  const errors: RefreshError[] = []

  console.log('Starting data refresh...')

  await store.set(KEYS.REFRESH_LAST_ATTEMPT, new Date().toISOString())

  // 1. Fetch GitHub data
  console.log('Fetching GitHub data...')
  const githubResult = await fetchGitHubData()
  if (!githubResult.success) {
    errors.push({
      source: 'github',
      error: githubResult.error || 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }

  // 2. Fetch Discourse data
  console.log('Fetching Discourse data...')
  const discourseResult = await fetchDiscourseData()
  if (!discourseResult.success) {
    errors.push({
      source: 'discourse',
      error: discourseResult.error || 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }

  // 3. Fetch Reddit data (best-effort, don't fail if unavailable)
  console.log('Fetching Reddit data...')
  const redditResult = await fetchRedditData()
  if (!redditResult.success) {
    // Reddit failures are expected and don't cause overall failure
    console.warn('Reddit fetch failed (non-critical):', redditResult.error)
    errors.push({
      source: 'reddit',
      error: redditResult.error || 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }

  // 4. Aggregate community data
  console.log('Aggregating community data...')
  const discourse = discourseResult.data || (await getDiscourseOverview())
  const reddit = redditResult.data || (await getRedditOverview())
  const community = await aggregateCommunityData(discourse, reddit)

  // 5. Calculate health score
  console.log('Calculating health score...')
  const github = githubResult.data || (await getGitHubOverview())
  await calculateHealthScore(github, community)

  // Determine overall status
  let status: RefreshStatus = 'ok'
  if (errors.length > 0) {
    // If only Reddit failed, it's still "ok" (Reddit is optional)
    const criticalErrors = errors.filter(
      (e) => e.source !== 'reddit'
    )
    if (criticalErrors.length > 0) {
      status = 'partial'
    }
    if (criticalErrors.length >= 2) {
      status = 'fail'
    }
  }

  // Store refresh metadata
  await store.set(KEYS.REFRESH_LAST_STATUS, status)
  await store.set(KEYS.REFRESH_LAST_ERRORS, errors)

  if (status !== 'fail') {
    await store.set(KEYS.REFRESH_LAST_SUCCESS, new Date().toISOString())
  }

  const duration = Date.now() - startTime
  console.log(`Refresh completed in ${duration}ms with status: ${status}`)

  return {
    status,
    errors,
    duration,
  }
}

export async function getRefreshMetadata(): Promise<RefreshMetadata> {
  const [lastSuccess, lastAttempt, lastStatus, lastErrors] = await Promise.all([
    store.get<string>(KEYS.REFRESH_LAST_SUCCESS),
    store.get<string>(KEYS.REFRESH_LAST_ATTEMPT),
    store.get<RefreshStatus>(KEYS.REFRESH_LAST_STATUS),
    store.get<RefreshError[]>(KEYS.REFRESH_LAST_ERRORS),
  ])

  return {
    lastSuccess,
    lastAttempt,
    lastStatus,
    lastErrors: lastErrors || [],
  }
}
