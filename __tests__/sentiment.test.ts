import { describe, it, expect } from 'vitest'
import { analyzeSentiment, classifySentiment } from '@/lib/fetchers/sentiment'

describe('Sentiment Analysis', () => {
  describe('analyzeSentiment', () => {
    it('should return positive score for positive text', () => {
      const result = analyzeSentiment('This is amazing and wonderful!')
      expect(result.score).toBeGreaterThan(0)
      expect(result.positive.length).toBeGreaterThan(0)
    })

    it('should return negative score for negative text', () => {
      const result = analyzeSentiment('This is terrible and broken!')
      expect(result.score).toBeLessThan(0)
      expect(result.negative.length).toBeGreaterThan(0)
    })

    it('should return near-zero score for neutral text', () => {
      const result = analyzeSentiment('The sky is blue today.')
      expect(Math.abs(result.score)).toBeLessThan(1)
    })

    it('should handle negation words', () => {
      const positive = analyzeSentiment('This is good')
      const negated = analyzeSentiment('This is not good')

      expect(positive.score).toBeGreaterThan(negated.score)
    })

    it('should handle intensifiers', () => {
      const normal = analyzeSentiment('This is good')
      const intensified = analyzeSentiment('This is very good')

      expect(intensified.score).toBeGreaterThan(normal.score)
    })

    it('should return empty arrays for text with no sentiment words', () => {
      const result = analyzeSentiment('The table is wooden')
      expect(result.positive).toHaveLength(0)
      expect(result.negative).toHaveLength(0)
    })

    it('should normalize score to [-5, 5] range', () => {
      const veryNegative = analyzeSentiment(
        'terrible awful horrible disaster failure broken crash'
      )
      const veryPositive = analyzeSentiment(
        'amazing excellent fantastic brilliant wonderful love great'
      )

      expect(veryNegative.score).toBeGreaterThanOrEqual(-5)
      expect(veryPositive.score).toBeLessThanOrEqual(5)
    })

    it('should handle empty string', () => {
      const result = analyzeSentiment('')
      expect(result.score).toBe(0)
      expect(result.tokens).toBe(0)
    })

    it('should handle Ubuntu-specific terms', () => {
      const bugReport = analyzeSentiment('There is a bug and it crashed')
      expect(bugReport.score).toBeLessThan(0)

      const positive = analyzeSentiment('The update fixed the issue perfectly')
      expect(positive.score).toBeGreaterThan(0)
    })
  })

  describe('classifySentiment', () => {
    it('should classify positive scores as positive', () => {
      expect(classifySentiment(1)).toBe('positive')
      expect(classifySentiment(3)).toBe('positive')
      expect(classifySentiment(0.5)).toBe('positive')
    })

    it('should classify negative scores as negative', () => {
      expect(classifySentiment(-1)).toBe('negative')
      expect(classifySentiment(-3)).toBe('negative')
      expect(classifySentiment(-0.5)).toBe('negative')
    })

    it('should classify near-zero scores as neutral', () => {
      expect(classifySentiment(0)).toBe('neutral')
      expect(classifySentiment(0.4)).toBe('neutral')
      expect(classifySentiment(-0.4)).toBe('neutral')
    })
  })
})
