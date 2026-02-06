import { kv, createClient } from '@vercel/kv'

// In-memory store for local development when KV is not configured
const memoryStore = new Map<string, string>()

// Get KV URL and token, checking multiple possible env var names
function getKVConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.CRON_SECRET_KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.CRON_SECRET_KV_REST_API_TOKEN

  if (url && token) {
    return { url, token }
  }
  return null
}

// Check if KV is properly configured
function isKVConfigured(): boolean {
  return getKVConfig() !== null
}

// Create KV client with the available config
function getKVClient() {
  const config = getKVConfig()
  if (config) {
    return createClient({
      url: config.url,
      token: config.token,
    })
  }
  return kv // fallback to default (won't work without env vars)
}

export interface KVStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: { ex?: number }): Promise<void>
  del(key: string): Promise<void>
  keys(pattern: string): Promise<string[]>
}

class VercelKVStore implements KVStore {
  private client = getKVClient()

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key)
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
    try {
      if (options?.ex) {
        await this.client.set(key, value, { ex: options.ex })
      } else {
        await this.client.set(key, value)
      }
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error)
      // Don't throw - just log the error so refresh can continue
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`KV del error for key ${key}:`, error)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      console.error(`KV keys error for pattern ${pattern}:`, error)
      return []
    }
  }
}

class MemoryStore implements KVStore {
  private expirations = new Map<string, number>()

  private isExpired(key: string): boolean {
    const expiry = this.expirations.get(key)
    if (!expiry) return false
    if (Date.now() > expiry) {
      memoryStore.delete(key)
      this.expirations.delete(key)
      return true
    }
    return false
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isExpired(key)) return null
    const value = memoryStore.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, options?: { ex?: number }): Promise<void> {
    memoryStore.set(key, JSON.stringify(value))
    if (options?.ex) {
      this.expirations.set(key, Date.now() + options.ex * 1000)
    }
  }

  async del(key: string): Promise<void> {
    memoryStore.delete(key)
    this.expirations.delete(key)
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (just supports * at end)
    const prefix = pattern.replace('*', '')
    const keys: string[] = []
    const allKeys = Array.from(memoryStore.keys())
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        if (!this.isExpired(key)) {
          keys.push(key)
        }
      }
    }
    return keys
  }
}

// Export the appropriate store based on configuration
export const store: KVStore = isKVConfigured()
  ? new VercelKVStore()
  : new MemoryStore()

// Key constants
export const KEYS = {
  REFRESH_LAST_SUCCESS: 'refresh:last_success',
  REFRESH_LAST_ATTEMPT: 'refresh:last_attempt',
  REFRESH_LAST_STATUS: 'refresh:last_status',
  REFRESH_LAST_ERRORS: 'refresh:last_errors',
  GITHUB_OVERVIEW: 'github:overview:30d',
  GITHUB_REPO: (owner: string, repo: string) => `github:repo:${owner}_${repo}:30d`,
  COMMUNITY_OVERVIEW: 'community:overview:30d',
  DISCOURSE_OVERVIEW: 'discourse:overview:30d',
  REDDIT_OVERVIEW: 'reddit:overview:30d',
  COMMUNITY_NEGATIVE_ITEMS: 'community:items:negative',
  HEALTH_SCORE: 'health:score',
} as const

// Helper to check if using memory store (for UI display)
export function isUsingMemoryStore(): boolean {
  return !isKVConfigured()
}
