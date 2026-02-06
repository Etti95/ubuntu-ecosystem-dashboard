'use client'

import { useState, useEffect } from 'react'
import { GitHubOverview, GitHubRepoData } from '@/types'
import {
  IssuesOpenedClosedChart,
  DistributionChart,
  LabelsChart,
} from '@/components/Charts'
import KPICard from '@/components/KPICard'

interface GitHubClientProps {
  overview: GitHubOverview | null
  availableRepos: string[]
}

export default function GitHubClient({
  overview,
  availableRepos,
}: GitHubClientProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('all')
  const [repoData, setRepoData] = useState<GitHubRepoData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedRepo === 'all') {
      setRepoData(null)
      return
    }

    const fetchRepoData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/metrics/github?repo=${encodeURIComponent(selectedRepo)}`
        )
        if (response.ok) {
          const data = await response.json()
          setRepoData(data)
        }
      } catch (error) {
        console.error('Failed to fetch repo data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepoData()
  }, [selectedRepo])

  if (!overview) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">GitHub Metrics</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-700">
            No GitHub data available. Please refresh data from the Overview page.
          </p>
        </div>
      </div>
    )
  }

  const displayData = selectedRepo === 'all' ? null : repoData
  const chartData = displayData?.dailyStats || overview.aggregatedDailyStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GitHub Metrics</h1>
          <p className="text-gray-500 mt-1">
            Issue tracking across Ubuntu/Canonical repositories
          </p>
        </div>

        {/* Repo selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="repo-select" className="text-sm text-gray-600">
            Repository:
          </label>
          <select
            id="repo-select"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ubuntu-orange focus:border-transparent"
          >
            <option value="all">All Repositories</option>
            {availableRepos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ubuntu-orange"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Open Issues"
              value={
                displayData?.openIssuesCount ?? overview.totalOpenIssues
              }
              subtitle="Current count"
            />
            <KPICard
              title="Opened (30d)"
              value={
                displayData?.issuesOpenedLast30d ?? overview.totalOpenedLast30d
              }
              subtitle="Issues opened"
            />
            <KPICard
              title="Closed (30d)"
              value={
                displayData?.issuesClosedLast30d ?? overview.totalClosedLast30d
              }
              subtitle="Issues closed"
            />
            <KPICard
              title="Median Response"
              value={
                displayData?.medianTimeToFirstResponseHours != null
                  ? `${Math.round(displayData.medianTimeToFirstResponseHours)}h`
                  : overview.overallMedianFirstResponseHours != null
                    ? `${Math.round(overview.overallMedianFirstResponseHours)}h`
                    : 'N/A'
              }
              subtitle="Time to first response"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IssuesOpenedClosedChart
              data={chartData}
              title={
                selectedRepo === 'all'
                  ? 'Issues Opened vs Closed (All Repos)'
                  : `Issues Opened vs Closed (${selectedRepo})`
              }
            />

            {displayData?.timeToFirstResponseDistribution && (
              <DistributionChart
                data={displayData.timeToFirstResponseDistribution}
                title="Time to First Response Distribution"
              />
            )}

            {displayData?.timeToCloseDistribution && (
              <DistributionChart
                data={displayData.timeToCloseDistribution}
                title="Time to Close Distribution"
              />
            )}

            {displayData?.topLabels && displayData.topLabels.length > 0 && (
              <LabelsChart data={displayData.topLabels} title="Top Labels" />
            )}
          </div>

          {/* Most Discussed Issues Table */}
          {displayData?.mostDiscussedIssues &&
            displayData.mostDiscussedIssues.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Most Discussed Issues
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayData.mostDiscussedIssues.map((issue) => (
                        <tr key={issue.number}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ubuntu-orange hover:underline"
                            >
                              #{issue.number}: {issue.title}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {issue.comments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* All repos summary when "all" selected */}
          {selectedRepo === 'all' && overview.repoSummaries && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Repository Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Repository
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Open
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened (30d)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Closed (30d)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overview.repoSummaries.map((repo) => {
                      const ratio =
                        repo.opened30d > 0
                          ? (repo.closed30d / repo.opened30d).toFixed(2)
                          : '-'
                      return (
                        <tr key={`${repo.owner}/${repo.repo}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <button
                              onClick={() =>
                                setSelectedRepo(`${repo.owner}/${repo.repo}`)
                              }
                              className="text-ubuntu-orange hover:underline"
                            >
                              {repo.owner}/{repo.repo}
                            </button>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {ratio}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Last fetched */}
      {overview.fetchedAt && (
        <p className="text-xs text-gray-400 text-center">
          Data fetched: {new Date(overview.fetchedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
