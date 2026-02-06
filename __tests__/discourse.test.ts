import { describe, it, expect } from 'vitest'
import { CONFIG, ComplaintBucket } from '@/lib/config'

describe('Discourse Processing', () => {
  describe('Keyword Matching', () => {
    function matchesKeywords(text: string, keywords: string[]): boolean {
      const lowerText = text.toLowerCase()
      return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
    }

    it('should match general keywords', () => {
      const text = 'How to install Snapd on Ubuntu 22.04'
      expect(matchesKeywords(text, CONFIG.keywords.general)).toBe(true)
    })

    it('should be case insensitive', () => {
      const text = 'UBUNTU SNAP installation issue'
      expect(matchesKeywords(text, CONFIG.keywords.general)).toBe(true)
    })

    it('should not match unrelated text', () => {
      const text = 'My cat likes to sleep on the couch'
      expect(matchesKeywords(text, CONFIG.keywords.general)).toBe(false)
    })

    it('should match partial words', () => {
      const text = 'snapcraft build failing'
      expect(matchesKeywords(text, ['snap'])).toBe(true)
    })
  })

  describe('Complaint Categorization', () => {
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

    it('should categorize snaps/security complaints', () => {
      expect(categorizeComplaint('Snap store has malware!')).toBe('snaps_security')
      expect(categorizeComplaint('Is snapd secure?')).toBe('snaps_security')
    })

    it('should categorize update/breakage complaints', () => {
      expect(categorizeComplaint('Update broke my system')).toBe('updates_breakage')
      expect(categorizeComplaint('Upgrade failed with dependency error')).toBe(
        'updates_breakage'
      )
    })

    it('should categorize performance complaints', () => {
      expect(categorizeComplaint('System is very slow on my machine')).toBe(
        'performance'
      )
      expect(categorizeComplaint('High CPU usage issue')).toBe('performance')
    })

    it('should categorize enterprise complaints', () => {
      expect(categorizeComplaint('Need enterprise support for compliance')).toBe(
        'enterprise_support'
      )
      expect(categorizeComplaint('SLA requirements for Ubuntu LTS')).toBe(
        'enterprise_support'
      )
    })

    it('should categorize packaging complaints', () => {
      expect(categorizeComplaint('APT package installation problem')).toBe(
        'packaging_dev_workflow'
      )
      expect(categorizeComplaint('Build toolchain issues')).toBe(
        'packaging_dev_workflow'
      )
    })

    it('should return null for uncategorized text', () => {
      expect(categorizeComplaint('How do I use VSCode?')).toBeNull()
      expect(categorizeComplaint('Best Linux distro for gaming')).toBeNull()
    })

    it('should match first applicable category', () => {
      // Text contains both 'security' (snaps_security) and 'update' (updates_breakage)
      const text = 'Security update broke my system'
      const category = categorizeComplaint(text)
      // Should match whichever bucket is checked first
      expect(category).not.toBeNull()
    })
  })

  describe('Weekly Aggregation', () => {
    function getWeekStart(date: Date): string {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      return d.toISOString().split('T')[0]
    }

    it('should return Monday for any day of the week', () => {
      // Wednesday March 13, 2024
      expect(getWeekStart(new Date('2024-03-13'))).toBe('2024-03-11')
      // Sunday March 17, 2024
      expect(getWeekStart(new Date('2024-03-17'))).toBe('2024-03-11')
      // Monday March 11, 2024
      expect(getWeekStart(new Date('2024-03-11'))).toBe('2024-03-11')
    })

    it('should handle month boundaries', () => {
      // Friday March 1, 2024 -> week starts Feb 26
      expect(getWeekStart(new Date('2024-03-01'))).toBe('2024-02-26')
    })
  })

  describe('RSS Item Processing', () => {
    it('should parse date from pubDate', () => {
      const pubDate = 'Wed, 13 Mar 2024 15:30:00 +0000'
      const date = new Date(pubDate)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(2) // March is 2 (0-indexed)
      expect(date.getDate()).toBe(13)
    })

    it('should filter items older than 30 days', () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentDate = new Date(now)
      recentDate.setDate(recentDate.getDate() - 10)

      const oldDate = new Date(now)
      oldDate.setDate(oldDate.getDate() - 45)

      expect(recentDate >= thirtyDaysAgo).toBe(true)
      expect(oldDate >= thirtyDaysAgo).toBe(false)
    })

    it('should deduplicate items by link', () => {
      const items = [
        { link: 'https://example.com/1', title: 'First' },
        { link: 'https://example.com/2', title: 'Second' },
        { link: 'https://example.com/1', title: 'First Duplicate' },
      ]

      const uniqueItems = Array.from(
        new Map(items.map((item) => [item.link, item])).values()
      )

      expect(uniqueItems).toHaveLength(2)
      expect(uniqueItems.map((i) => i.link)).toContain('https://example.com/1')
      expect(uniqueItems.map((i) => i.link)).toContain('https://example.com/2')
    })
  })
})
