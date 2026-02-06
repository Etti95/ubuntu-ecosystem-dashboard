'use client'

import { HealthScore } from '@/types'

interface HealthScoreGaugeProps {
  score: HealthScore | null
  showDetails?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Attention'
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function HealthScoreGauge({
  score,
  showDetails = true,
}: HealthScoreGaugeProps) {
  if (!score) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Health Score
        </h3>
        <div className="text-center py-8 text-gray-500">
          No data available. Click refresh to load data.
        </div>
      </div>
    )
  }

  const { overall, components } = score

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Health Score</h3>
        <span className="text-sm text-gray-400" title="Click for methodology">
          ?
        </span>
      </div>

      {/* Main score display */}
      <div className="text-center mb-6">
        <div
          className={`text-6xl font-bold ${getScoreColor(overall)}`}
        >
          {overall}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {getScoreLabel(overall)}
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(overall)}`}
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      {/* Component breakdown */}
      {showDetails && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600">Score Breakdown</h4>

          {Object.entries(components).map(([key, comp]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium">
                    {comp.score}
                    <span className="text-gray-400 text-xs ml-1">
                      ({Math.round(comp.weight * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getScoreBgColor(comp.score)}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {comp.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-4 text-center">
        Last calculated:{' '}
        {new Date(score.calculatedAt).toLocaleString()}
      </div>
    </div>
  )
}
