'use client'

import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = '',
}: KPICardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-500'

  const trendArrow =
    trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : ''

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-100 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trendValue && (
            <p className={`mt-1 text-sm ${trendColor}`}>
              {trendArrow} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-ubuntu-orange/10 rounded-lg text-ubuntu-orange">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
