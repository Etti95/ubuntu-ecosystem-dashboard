// Utility functions for fetchers

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return response
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delayMs * (attempt + 1)
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`)
        await sleep(waitTime)
        continue
      }

      // For other non-OK responses, throw to retry
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`)
      }

      // Client errors (4xx except 429) - don't retry
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxRetries - 1) {
        const waitTime = delayMs * Math.pow(2, attempt)
        console.log(`Fetch attempt ${attempt + 1} failed. Retrying in ${waitTime}ms...`)
        await sleep(waitTime)
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries')
}

export function getDateRangeStrings(daysBack: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysBack)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDaysBetween(start: Date, end: Date): string[] {
  const days: string[] = []
  const current = new Date(start)

  while (current <= end) {
    days.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}
