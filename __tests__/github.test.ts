import { describe, it, expect } from 'vitest'
import { median, formatDate, getDaysBetween } from '@/lib/fetchers/utils'

describe('GitHub Fetcher Utils', () => {
  describe('median', () => {
    it('should return null for empty array', () => {
      expect(median([])).toBeNull()
    })

    it('should return the single value for one-element array', () => {
      expect(median([5])).toBe(5)
    })

    it('should return middle value for odd-length array', () => {
      expect(median([1, 2, 3])).toBe(2)
      expect(median([1, 3, 5, 7, 9])).toBe(5)
    })

    it('should return average of middle values for even-length array', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5)
      expect(median([1, 3, 5, 7])).toBe(4)
    })

    it('should handle unsorted arrays', () => {
      expect(median([3, 1, 2])).toBe(2)
      expect(median([9, 3, 7, 1, 5])).toBe(5)
    })

    it('should handle arrays with duplicates', () => {
      expect(median([1, 1, 1])).toBe(1)
      expect(median([1, 2, 2, 3])).toBe(2)
    })

    it('should handle decimal values', () => {
      expect(median([1.5, 2.5, 3.5])).toBe(2.5)
    })
  })

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T12:00:00Z')
      expect(formatDate(date)).toBe('2024-03-15')
    })

    it('should handle dates at different times', () => {
      const date1 = new Date('2024-01-01T00:00:00Z')
      const date2 = new Date('2024-01-01T23:59:59Z')
      expect(formatDate(date1)).toBe('2024-01-01')
      expect(formatDate(date2)).toBe('2024-01-01')
    })
  })

  describe('getDaysBetween', () => {
    it('should return single day for same start and end', () => {
      const date = new Date('2024-03-15')
      const days = getDaysBetween(date, date)
      expect(days).toHaveLength(1)
      expect(days[0]).toBe('2024-03-15')
    })

    it('should return correct number of days', () => {
      const start = new Date('2024-03-01')
      const end = new Date('2024-03-03')
      const days = getDaysBetween(start, end)
      expect(days).toHaveLength(3)
      expect(days).toEqual(['2024-03-01', '2024-03-02', '2024-03-03'])
    })

    it('should handle month boundaries', () => {
      const start = new Date('2024-02-28')
      const end = new Date('2024-03-02')
      const days = getDaysBetween(start, end)
      expect(days).toHaveLength(4)
      expect(days).toEqual([
        '2024-02-28',
        '2024-02-29', // 2024 is leap year
        '2024-03-01',
        '2024-03-02',
      ])
    })

    it('should return 30 days for 30-day range', () => {
      const end = new Date('2024-03-30')
      const start = new Date('2024-03-01')
      const days = getDaysBetween(start, end)
      expect(days).toHaveLength(30)
    })
  })
})

describe('GitHub Data Aggregation', () => {
  describe('Label counting', () => {
    it('should count labels correctly', () => {
      const issues = [
        { labels: [{ name: 'bug' }, { name: 'priority' }] },
        { labels: [{ name: 'bug' }] },
        { labels: [{ name: 'feature' }] },
      ]

      const labelCounts = new Map<string, number>()
      for (const issue of issues) {
        for (const label of issue.labels) {
          labelCounts.set(label.name, (labelCounts.get(label.name) || 0) + 1)
        }
      }

      expect(labelCounts.get('bug')).toBe(2)
      expect(labelCounts.get('priority')).toBe(1)
      expect(labelCounts.get('feature')).toBe(1)
    })
  })

  describe('Daily stats calculation', () => {
    it('should aggregate daily opened/closed correctly', () => {
      const issues = [
        { created_at: '2024-03-01T10:00:00Z', closed_at: '2024-03-02T10:00:00Z' },
        { created_at: '2024-03-01T15:00:00Z', closed_at: null },
        { created_at: '2024-03-02T10:00:00Z', closed_at: '2024-03-02T15:00:00Z' },
      ]

      const dailyStats = new Map<string, { opened: number; closed: number }>()

      for (const issue of issues) {
        const createdDate = issue.created_at.split('T')[0]
        const stats = dailyStats.get(createdDate) || { opened: 0, closed: 0 }
        stats.opened++
        dailyStats.set(createdDate, stats)

        if (issue.closed_at) {
          const closedDate = issue.closed_at.split('T')[0]
          const closedStats = dailyStats.get(closedDate) || { opened: 0, closed: 0 }
          closedStats.closed++
          dailyStats.set(closedDate, closedStats)
        }
      }

      expect(dailyStats.get('2024-03-01')?.opened).toBe(2)
      expect(dailyStats.get('2024-03-01')?.closed).toBe(0)
      expect(dailyStats.get('2024-03-02')?.opened).toBe(1)
      expect(dailyStats.get('2024-03-02')?.closed).toBe(2)
    })
  })

  describe('Time-to-close calculation', () => {
    it('should calculate time-to-close in hours', () => {
      const issue = {
        created_at: '2024-03-01T10:00:00Z',
        closed_at: '2024-03-02T10:00:00Z',
      }

      const created = new Date(issue.created_at)
      const closed = new Date(issue.closed_at)
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)

      expect(diffHours).toBe(24)
    })

    it('should handle same-day closure', () => {
      const issue = {
        created_at: '2024-03-01T10:00:00Z',
        closed_at: '2024-03-01T12:30:00Z',
      }

      const created = new Date(issue.created_at)
      const closed = new Date(issue.closed_at)
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)

      expect(diffHours).toBe(2.5)
    })
  })
})
