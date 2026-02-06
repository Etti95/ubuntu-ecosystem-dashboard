'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { GitHubDailyStats } from '@/types'

const COLORS = [
  '#E95420', // Ubuntu orange
  '#772953', // Ubuntu aubergine
  '#AEA79F', // Ubuntu warm grey
  '#77216F', // Ubuntu purple
  '#2C001E', // Ubuntu dark aubergine
  '#5E2750', // Ubuntu mid aubergine
]

interface IssuesChartProps {
  data: GitHubDailyStats[]
  title?: string
}

export function IssuesOpenedClosedChart({ data, title }: IssuesChartProps) {
  // Show last 30 days, aggregate if more data
  const chartData = data.slice(-30)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {title && (
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="opened"
            stroke="#E95420"
            name="Opened"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="closed"
            stroke="#772953"
            name="Closed"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DistributionChartProps {
  data: Array<{ bucket: string; count: number }>
  title: string
}

export function DistributionChart({ data, title }: DistributionChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#E95420" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SentimentChartProps {
  data: Array<{ date: string; avgSentiment: number; postCount: number }>
  title?: string
}

export function SentimentTrendChart({ data, title }: SentimentChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        {title && (
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        )}
        <div className="h-64 flex items-center justify-center text-gray-500">
          Sentiment data not available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {title && (
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} domain={[-3, 3]} />
          <Tooltip
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            formatter={(value: number) => [value.toFixed(2), 'Sentiment']}
          />
          <Line
            type="monotone"
            dataKey="avgSentiment"
            stroke="#772953"
            name="Sentiment"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CategoryChartProps {
  data: Record<string, number>
  title: string
}

export function CategoryBreakdownChart({ data, title }: CategoryChartProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No category data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={100}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface WeeklyActivityChartProps {
  data: Array<{ week: string; count: number }>
  title: string
}

export function WeeklyActivityChart({ data, title }: WeeklyActivityChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(label) => `Week of ${new Date(label).toLocaleDateString()}`}
          />
          <Bar dataKey="count" fill="#E95420" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LabelChartProps {
  data: Array<{ name: string; count: number }>
  title: string
}

export function LabelsChart({ data, title }: LabelChartProps) {
  const chartData = data.slice(0, 10)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={120}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#772953" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
