'use client'

import { DashboardOverview } from '@/types'
import KPICard from '@/components/KPICard'
import HealthScoreGauge from '@/components/HealthScoreGauge'
import RefreshButton from '@/components/RefreshButton'
import { IssuesOpenedClosedChart, SentimentTrendChart } from '@/components/Charts'
import { isUsingMemoryStore } from '@/lib/store'

interface OverviewClientProps {
  initialData: Partial<DashboardOverview>
}

export default function OverviewClient({ initialData }: OverviewClientProps) {
  const { healthScore, github, community, refresh } = initialData

  const hasData = github || community

  // Calculate KPI values
  const issuesOpened7d = github?.totalOpenedLast7d ?? 0
  const issuesClosed7d = github?.totalClosedLast7d ?? 0
  const medianResponse = github?.overallMedianFirstResponseHours
    ? `${Math.round(github.overallMedianFirstResponseHours)}h`
    : 'N/A'
  const sentiment = community?.overallSentiment
    ? community.overallSentiment.toFixed(2)
    : 'N/A'
  const topComplaint = community?.topComplaintCategory
    ? community.topComplaintCategory.replace(/_/g, ' ')
    : 'N/A'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Ubuntu Ecosystem Health
          </h1>
          <p className="text-gray-500 mt-1">
            Aggregated public signals from GitHub, Discourse, and Reddit
          </p>
        </div>
        <RefreshButton metadata={refresh || null} />
      </div>

      {/* Memory store warning */}
      {isUsingMemoryStore() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Development Mode:</strong> Using in-memory storage. Data
                will be lost on restart. Configure Vercel KV for persistence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {!hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Welcome to the Ubuntu Ecosystem Dashboard
          </h2>
          <p className="text-blue-700 mb-4">
            No data has been loaded yet. Click the &quot;Refresh Data&quot; button above to
            fetch the latest metrics from GitHub, Discourse, and Reddit.
          </p>
          <p className="text-sm text-blue-600">
            This initial fetch may take a few minutes as it gathers data from
            multiple sources.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Health Score and KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HealthScoreGauge score={healthScore || null} />
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <KPICard
                title="Issues Opened (7d)"
                value={issuesOpened7d}
                subtitle="Across all tracked repos"
                trend={issuesOpened7d > issuesClosed7d ? 'up' : 'down'}
              />
              <KPICard
                title="Issues Closed (7d)"
                value={issuesClosed7d}
                subtitle="Across all tracked repos"
                trend={issuesClosed7d >= issuesOpened7d ? 'up' : 'neutral'}
              />
              <KPICard
                title="Median Response Time"
                value={medianResponse}
                subtitle="Time to first response (30d)"
              />
              <KPICard
                title="Community Sentiment"
                value={sentiment}
                subtitle={
                  community?.reddit?.available
                    ? 'Average from Reddit posts'
                    : 'Reddit data unavailable'
                }
              />
              <KPICard
                title="Top Complaint Category"
                value={topComplaint}
                subtitle="Most frequent topic (30d)"
                className="col-span-2"
              />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {github?.aggregatedDailyStats && (
              <IssuesOpenedClosedChart
                data={github.aggregatedDailyStats}
                title="Issues Opened vs Closed (30 days)"
              />
            )}

            {community?.reddit?.dailySentiment && (
              <SentimentTrendChart
                data={community.reddit.dailySentiment}
                title="Community Sentiment Trend"
              />
            )}
          </div>

          {/* Repository Summary */}
          {github?.repoSummaries && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Repository Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Repository
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Open Issues
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened (30d)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Closed (30d)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {github.repoSummaries.map((repo) => (
                      <tr key={`${repo.owner}/${repo.repo}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <a
                            href={`https://github.com/${repo.owner}/${repo.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ubuntu-orange hover:underline"
                          >
                            {repo.owner}/{repo.repo}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {repo.openIssues}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {repo.opened30d}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {repo.closed30d}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors/Warnings */}
          {refresh?.lastErrors && refresh.lastErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                Refresh Warnings
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {refresh.lastErrors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.source}:</strong> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
