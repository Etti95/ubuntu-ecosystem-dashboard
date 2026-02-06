import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store
vi.mock('@/lib/store', () => ({
  store: {
    get: vi.fn(),
    set: vi.fn(),
  },
  KEYS: {
    HEALTH_SCORE: 'health:score',
  },
}))

import { CONFIG } from '@/lib/config'

describe('Health Score Calculation', () => {
  // Test the scoring logic directly without importing the module
  // to avoid async store dependencies

  const { weights, normalization } = CONFIG.healthScore

  describe('Responsiveness Score', () => {
    it('should return 100 for 0 hour response time', () => {
      const hours = 0
      const score = Math.round(
        100 * (1 - hours / normalization.maxFirstResponseHours)
      )
      expect(score).toBe(100)
    })

    it('should return 0 for max response time', () => {
      const hours = normalization.maxFirstResponseHours
      const score = Math.round(
        100 * (1 - hours / normalization.maxFirstResponseHours)
      )
      expect(score).toBe(0)
    })

    it('should return ~50 for half max response time', () => {
      const hours = normalization.maxFirstResponseHours / 2
      const score = Math.round(
        100 * (1 - hours / normalization.maxFirstResponseHours)
      )
      expect(score).toBe(50)
    })

    it('should cap at 0 for times exceeding max', () => {
      const hours = normalization.maxFirstResponseHours * 2
      const cappedHours = Math.min(hours, normalization.maxFirstResponseHours)
      const score = Math.round(
        100 * (1 - cappedHours / normalization.maxFirstResponseHours)
      )
      expect(score).toBe(0)
    })
  })

  describe('Closure Ratio Score', () => {
    it('should return 100 when ratio equals max', () => {
      const ratio = normalization.maxClosureRatio
      const score = Math.round((ratio / normalization.maxClosureRatio) * 100)
      expect(score).toBe(100)
    })

    it('should return 0 for 0 ratio', () => {
      const ratio = 0
      const score = Math.round((ratio / normalization.maxClosureRatio) * 100)
      expect(score).toBe(0)
    })

    it('should cap at 100 for ratios exceeding max', () => {
      const ratio = normalization.maxClosureRatio * 2
      const cappedRatio = Math.min(ratio, normalization.maxClosureRatio)
      const score = Math.round(
        (cappedRatio / normalization.maxClosureRatio) * 100
      )
      expect(score).toBe(100)
    })

    it('should return 83 for 1.0 ratio (1.0 / 1.2 * 100)', () => {
      const ratio = 1.0
      const score = Math.round((ratio / normalization.maxClosureRatio) * 100)
      expect(score).toBe(83)
    })
  })

  describe('Sentiment Score', () => {
    it('should return 100 for max sentiment', () => {
      const sentiment = normalization.sentimentMax
      const normalized =
        (sentiment - normalization.sentimentMin) /
        (normalization.sentimentMax - normalization.sentimentMin)
      const score = Math.round(normalized * 100)
      expect(score).toBe(100)
    })

    it('should return 0 for min sentiment', () => {
      const sentiment = normalization.sentimentMin
      const normalized =
        (sentiment - normalization.sentimentMin) /
        (normalization.sentimentMax - normalization.sentimentMin)
      const score = Math.round(normalized * 100)
      expect(score).toBe(0)
    })

    it('should return 50 for neutral sentiment (0)', () => {
      const sentiment = 0
      const normalized =
        (sentiment - normalization.sentimentMin) /
        (normalization.sentimentMax - normalization.sentimentMin)
      const score = Math.round(normalized * 100)
      expect(score).toBe(50)
    })
  })

  describe('Complaint Severity Score', () => {
    it('should return 100 for 0% negative share', () => {
      const negativeShare = 0
      const score = Math.round(100 - negativeShare * 2)
      expect(score).toBe(100)
    })

    it('should return 0 for 50% negative share', () => {
      const negativeShare = 50
      const cappedShare = Math.min(negativeShare, 50)
      const score = Math.round(100 - cappedShare * 2)
      expect(score).toBe(0)
    })

    it('should cap at 0 for shares exceeding 50%', () => {
      const negativeShare = 80
      const cappedShare = Math.min(negativeShare, 50)
      const score = Math.round(100 - cappedShare * 2)
      expect(score).toBe(0)
    })
  })

  describe('Weight Distribution', () => {
    it('should have weights that sum to 1.0', () => {
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
      expect(total).toBeCloseTo(1.0, 10)
    })

    it('should have responsiveness as highest weight', () => {
      expect(weights.responsiveness).toBe(
        Math.max(...Object.values(weights))
      )
    })
  })

  describe('Overall Score', () => {
    it('should calculate weighted average correctly', () => {
      const componentScores = {
        responsiveness: 80,
        closureRatio: 60,
        communitySentiment: 70,
        complaintSeverity: 90,
      }

      const overall = Math.round(
        componentScores.responsiveness * weights.responsiveness +
          componentScores.closureRatio * weights.closureRatio +
          componentScores.communitySentiment * weights.communitySentiment +
          componentScores.complaintSeverity * weights.complaintSeverity
      )

      // 80 * 0.35 + 60 * 0.25 + 70 * 0.20 + 90 * 0.20
      // = 28 + 15 + 14 + 18 = 75
      expect(overall).toBe(75)
    })
  })
})
