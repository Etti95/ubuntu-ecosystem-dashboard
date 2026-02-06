import { CONFIG } from '@/lib/config'
import { store, KEYS } from '@/lib/store'
import {
  HealthScore,
  GitHubOverview,
  CommunityOverview,
} from '@/types'

const { weights, normalization } = CONFIG.healthScore

/**
 * Calculate responsiveness score based on median time to first response
 * Lower response time = higher score
 */
function calculateResponsivenessScore(
  medianFirstResponseHours: number | null
): { score: number; rawValue: number | null; description: string } {
  if (medianFirstResponseHours === null) {
    return {
      score: 50, // Default to neutral if no data
      rawValue: null,
      description: 'No response time data available',
    }
  }

  // Cap at max hours
  const cappedHours = Math.min(
    medianFirstResponseHours,
    normalization.maxFirstResponseHours
  )

  // Inverse linear scale: 0 hours = 100, maxHours = 0
  const score = Math.round(
    100 * (1 - cappedHours / normalization.maxFirstResponseHours)
  )

  const hoursRounded = Math.round(medianFirstResponseHours * 10) / 10

  return {
    score: Math.max(0, Math.min(100, score)),
    rawValue: medianFirstResponseHours,
    description: `Median first response: ${hoursRounded}h`,
  }
}

/**
 * Calculate closure ratio score
 * Higher closure ratio = higher score
 */
function calculateClosureRatioScore(
  opened: number,
  closed: number
): { score: number; rawValue: number | null; description: string } {
  if (opened === 0) {
    return {
      score: 100,
      rawValue: null,
      description: 'No issues opened in period',
    }
  }

  const ratio = closed / opened

  // Cap at max ratio
  const cappedRatio = Math.min(ratio, normalization.maxClosureRatio)

  // Linear scale: 0 = 0, maxRatio = 100
  const score = Math.round((cappedRatio / normalization.maxClosureRatio) * 100)

  const ratioRounded = Math.round(ratio * 100) / 100

  return {
    score: Math.max(0, Math.min(100, score)),
    rawValue: ratio,
    description: `Closure ratio: ${ratioRounded} (${closed} closed / ${opened} opened)`,
  }
}

/**
 * Calculate community sentiment score
 * Higher sentiment = higher score
 */
function calculateSentimentScore(
  avgSentiment: number | null
): {
  score: number
  rawValue: number | null
  available: boolean
  description: string
} {
  if (avgSentiment === null) {
    return {
      score: 0, // Weight will be redistributed
      rawValue: null,
      available: false,
      description: 'Sentiment data not available',
    }
  }

  const { sentimentMin, sentimentMax } = normalization

  // Normalize sentiment from [min, max] to [0, 100]
  const normalized =
    (avgSentiment - sentimentMin) / (sentimentMax - sentimentMin)
  const score = Math.round(normalized * 100)

  const sentimentRounded = Math.round(avgSentiment * 100) / 100

  return {
    score: Math.max(0, Math.min(100, score)),
    rawValue: avgSentiment,
    available: true,
    description: `Average sentiment: ${sentimentRounded}`,
  }
}

/**
 * Calculate complaint severity score
 * Lower share of negative content = higher score
 */
function calculateComplaintSeverityScore(
  negativeSharePercent: number | null,
  totalComplaints: number
): { score: number; rawValue: number | null; description: string } {
  if (negativeSharePercent === null || totalComplaints === 0) {
    return {
      score: 70, // Default to moderately healthy if no data
      rawValue: null,
      description: 'Complaint data not available',
    }
  }

  // 100 - negativeShare (capped at 50%)
  const cappedShare = Math.min(negativeSharePercent, 50)
  const score = Math.round(100 - cappedShare * 2)

  const shareRounded = Math.round(negativeSharePercent * 10) / 10

  return {
    score: Math.max(0, Math.min(100, score)),
    rawValue: negativeSharePercent,
    description: `${shareRounded}% of content classified as negative`,
  }
}

export async function calculateHealthScore(
  github: GitHubOverview | null,
  community: CommunityOverview | null
): Promise<HealthScore> {
  // Calculate component scores
  const responsiveness = calculateResponsivenessScore(
    github?.overallMedianFirstResponseHours ?? null
  )

  const closureRatio = calculateClosureRatioScore(
    github?.totalOpenedLast30d ?? 0,
    github?.totalClosedLast30d ?? 0
  )

  const sentiment = calculateSentimentScore(
    community?.overallSentiment ?? null
  )

  // Calculate total complaints from community data
  const totalComplaints = community?.combinedComplaintCategories
    ? Object.values(community.combinedComplaintCategories).reduce(
        (a, b) => a + b,
        0
      )
    : 0

  const complaintSeverity = calculateComplaintSeverityScore(
    community?.reddit?.negativeSharePercent ?? null,
    totalComplaints
  )

  // Calculate weighted overall score
  // If sentiment not available, redistribute its weight
  let adjustedWeights: {
    responsiveness: number
    closureRatio: number
    communitySentiment: number
    complaintSeverity: number
  } = { ...weights }

  if (!sentiment.available) {
    const sentimentWeight = weights.communitySentiment
    const redistributeEach = sentimentWeight / 3
    adjustedWeights = {
      responsiveness: weights.responsiveness + redistributeEach,
      closureRatio: weights.closureRatio + redistributeEach,
      communitySentiment: 0,
      complaintSeverity: weights.complaintSeverity + redistributeEach,
    }
  }

  const overall = Math.round(
    responsiveness.score * adjustedWeights.responsiveness +
      closureRatio.score * adjustedWeights.closureRatio +
      sentiment.score * adjustedWeights.communitySentiment +
      complaintSeverity.score * adjustedWeights.complaintSeverity
  )

  const healthScore: HealthScore = {
    overall: Math.max(0, Math.min(100, overall)),
    components: {
      responsiveness: {
        score: responsiveness.score,
        weight: adjustedWeights.responsiveness,
        rawValue: responsiveness.rawValue,
        description: responsiveness.description,
      },
      closureRatio: {
        score: closureRatio.score,
        weight: adjustedWeights.closureRatio,
        rawValue: closureRatio.rawValue,
        description: closureRatio.description,
      },
      communitySentiment: {
        score: sentiment.score,
        weight: adjustedWeights.communitySentiment,
        rawValue: sentiment.rawValue,
        available: sentiment.available,
        description: sentiment.description,
      },
      complaintSeverity: {
        score: complaintSeverity.score,
        weight: adjustedWeights.complaintSeverity,
        rawValue: complaintSeverity.rawValue,
        description: complaintSeverity.description,
      },
    },
    calculatedAt: new Date().toISOString(),
  }

  await store.set(KEYS.HEALTH_SCORE, healthScore)

  return healthScore
}

export async function getHealthScore(): Promise<HealthScore | null> {
  return store.get<HealthScore>(KEYS.HEALTH_SCORE)
}
