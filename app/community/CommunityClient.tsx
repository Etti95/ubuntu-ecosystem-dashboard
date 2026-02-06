'use client'

import { CommunityOverview } from '@/types'
import KPICard from '@/components/KPICard'
import {
  CategoryBreakdownChart,
  SentimentTrendChart,
  WeeklyActivityChart,
} from '@/components/Charts'

interface CommunityClientProps {
  community: CommunityOverview | null
}

export default function CommunityClient({ community }: CommunityClientProps) {
  if (!community) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Community Insights</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-700">
            No community data available. Please refresh data from the Overview
            page.
          </p>
        </div>
      </div>
    )
  }

  const { discourse, reddit, combinedComplaintCategories, topComplaintCategory } =
    community

  const totalComplaints = Object.values(combinedComplaintCategories || {}).reduce(
    (a, b) => a + b,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Community Insights</h1>
        <p className="text-gray-500 mt-1">
          Discourse discussions and Reddit sentiment analysis
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Discourse Topics"
          value={discourse?.totalTopicsLast30d ?? 0}
          subtitle="Last 30 days"
        />
        <KPICard
          title="Reddit Posts"
          value={reddit?.totalPostsLast30d ?? 0}
          subtitle={reddit?.available ? 'Last 30 days' : 'Unavailable'}
        />
        <KPICard
          title="Avg Sentiment"
          value={
            reddit?.averageSentiment != null
              ? reddit.averageSentiment.toFixed(2)
              : 'N/A'
          }
          subtitle={
            reddit?.available
              ? 'Scale: -5 to +5'
              : 'Reddit data unavailable'
          }
        />
        <KPICard
          title="Negative Share"
          value={
            reddit?.negativeSharePercent != null
              ? `${reddit.negativeSharePercent.toFixed(1)}%`
              : 'N/A'
          }
          subtitle="Posts with negative sentiment"
        />
      </div>

      {/* Reddit unavailable notice */}
      {reddit && !reddit.available && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Reddit data is currently unavailable.{' '}
            {reddit.error && `Reason: ${reddit.error}`}
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart
          data={combinedComplaintCategories || {}}
          title="Complaint Categories"
        />

        {discourse?.topicsPerWeek && (
          <WeeklyActivityChart
            data={discourse.topicsPerWeek}
            title="Discourse Activity (Weekly)"
          />
        )}

        {reddit?.available && reddit.dailySentiment && (
          <SentimentTrendChart
            data={reddit.dailySentiment}
            title="Reddit Sentiment Trend"
          />
        )}
      </div>

      {/* Top Complaint Summary */}
      {topComplaintCategory && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Top Complaint Category
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-ubuntu-orange capitalize">
              {topComplaintCategory.replace(/_/g, ' ')}
            </div>
            <div className="text-gray-500">
              {combinedComplaintCategories?.[topComplaintCategory] || 0} mentions
              ({totalComplaints > 0
                ? (
                    ((combinedComplaintCategories?.[topComplaintCategory] || 0) /
                      totalComplaints) *
                    100
                  ).toFixed(0)
                : 0}
              % of all complaints)
            </div>
          </div>
        </div>
      )}

      {/* Recent Discourse Items */}
      {discourse?.recentItems && discourse.recentItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Recent Discourse Topics
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discourse.recentItems.slice(0, 10).map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ubuntu-orange hover:underline"
                      >
                        {item.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.pubDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.categories?.slice(0, 3).join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Negative Items */}
      {reddit?.topNegativeItems && reddit.topNegativeItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Most Negative Reddit Posts
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Posts with the lowest sentiment scores (may indicate pain points or
            complaints)
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subreddit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reddit.topNegativeItems.slice(0, 10).map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ubuntu-orange hover:underline"
                      >
                        {item.title.length > 80
                          ? item.title.slice(0, 80) + '...'
                          : item.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      r/{item.subreddit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className="text-red-600 font-medium">
                        {item.sentiment.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last fetched */}
      {community.fetchedAt && (
        <p className="text-xs text-gray-400 text-center">
          Data fetched: {new Date(community.fetchedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
