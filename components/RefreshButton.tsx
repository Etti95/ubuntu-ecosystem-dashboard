'use client'

import { useState } from 'react'
import { RefreshMetadata } from '@/types'

interface RefreshButtonProps {
  metadata: RefreshMetadata | null
  onRefreshComplete?: () => void
}

export default function RefreshButton({
  metadata,
  onRefreshComplete,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    setStatusMessage('Starting refresh...')

    try {
      const response = await fetch('/api/refresh', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Refresh failed')
      }

      setStatusMessage(`Refresh completed: ${data.status || 'ok'}`)

      if (onRefreshComplete) {
        onRefreshComplete()
      }

      // Wait a moment to show success, then reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Refresh failed'
      setError(errorMsg)
      setStatusMessage(null)
      setIsRefreshing(false)
    }
  }

  const statusColor =
    metadata?.lastStatus === 'ok'
      ? 'bg-green-100 text-green-800'
      : metadata?.lastStatus === 'partial'
        ? 'bg-yellow-100 text-yellow-800'
        : metadata?.lastStatus === 'fail'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800'

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          px-4 py-2 rounded-lg font-medium text-white
          transition-all duration-200
          ${
            isRefreshing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-ubuntu-orange hover:bg-ubuntu-orange-dark'
          }
        `}
      >
        {isRefreshing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Refreshing...
          </span>
        ) : (
          'Refresh Data'
        )}
      </button>

      <div className="text-sm">
        {metadata?.lastSuccess && (
          <div className="text-gray-500">
            Last updated:{' '}
            {new Date(metadata.lastSuccess).toLocaleString()}
          </div>
        )}
        {metadata?.lastStatus && (
          <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusColor}`}>
            Status: {metadata.lastStatus}
          </span>
        )}
      </div>

      {statusMessage && !error && (
        <div className="text-sm text-green-600">{statusMessage}</div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {metadata?.lastErrors && metadata.lastErrors.length > 0 && (
        <div className="text-xs text-gray-500">
          {metadata.lastErrors.length} warning(s)
        </div>
      )}
    </div>
  )
}
