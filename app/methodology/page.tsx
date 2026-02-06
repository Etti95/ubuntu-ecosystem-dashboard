import { CONFIG } from '@/lib/config'

export default function MethodologyPage() {
  const { weights, normalization } = CONFIG.healthScore

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Methodology</h1>
        <p className="text-gray-500 mt-2">
          Understanding how metrics are collected, calculated, and scored
        </p>
      </div>

      {/* Data Sources */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Data Sources
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">GitHub (Primary)</h3>
            <p className="text-sm text-gray-600 mt-1">
              We track issue activity from curated Ubuntu/Canonical repositories
              using the GitHub REST API. This includes:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
              <li>Issues opened and closed per day</li>
              <li>Time-to-first-response (sampled from issues with comments)</li>
              <li>Time-to-close for resolved issues</li>
              <li>Label frequency analysis</li>
              <li>Most discussed issues</li>
            </ul>
            <p className="text-sm text-gray-500 mt-2">
              Tracked repositories:{' '}
              {CONFIG.github.repos.map((r) => `${r.owner}/${r.repo}`).join(', ')}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Ubuntu Discourse (Primary)</h3>
            <p className="text-sm text-gray-600 mt-1">
              We parse RSS feeds from discourse.ubuntu.com to track community
              discussions. This provides:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
              <li>Topic volume over time</li>
              <li>Keyword matching for complaint categorization</li>
              <li>Recent topic listings</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Reddit (Optional)</h3>
            <p className="text-sm text-gray-600 mt-1">
              We attempt to fetch posts from Ubuntu-related subreddits using
              public JSON endpoints. This data source may be unavailable due to
              rate limiting. When available, it provides:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
              <li>Sentiment analysis of post titles and content</li>
              <li>Complaint category classification</li>
              <li>Daily sentiment trends</li>
            </ul>
            <p className="text-sm text-gray-500 mt-2">
              Tracked subreddits: r/Ubuntu, r/linux, r/linuxquestions
            </p>
          </div>
        </div>
      </section>

      {/* Metric Definitions */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Metric Definitions
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">
              Median Time-to-First-Response
            </h3>
            <p className="text-sm text-gray-600">
              The median time (in hours) between when an issue is opened and
              when it receives its first comment. Calculated from a sample of
              recently commented issues to stay within API limits.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Median Time-to-Close</h3>
            <p className="text-sm text-gray-600">
              The median time (in hours) between when an issue is opened and
              when it is closed. Only includes issues that were closed within
              the 30-day window.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Closure Ratio</h3>
            <p className="text-sm text-gray-600">
              The ratio of issues closed to issues opened in the 30-day period.
              A ratio &gt; 1.0 means more issues are being closed than opened
              (reducing backlog).
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Sentiment Score</h3>
            <p className="text-sm text-gray-600">
              Calculated using a lightweight AFINN-based lexicon analyzer. Each
              post is scored from -5 (very negative) to +5 (very positive). The
              analyzer accounts for negation words and intensifiers.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Complaint Categories</h3>
            <p className="text-sm text-gray-600">
              Posts and topics are classified into categories based on keyword
              matching:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
              <li>
                <strong>Snaps/Security:</strong> snap, snapd, store, malware,
                security
              </li>
              <li>
                <strong>Updates/Breakage:</strong> update, upgrade, broke,
                broken, dependency
              </li>
              <li>
                <strong>Performance:</strong> slow, lag, cpu, memory, freeze
              </li>
              <li>
                <strong>Enterprise Support:</strong> enterprise, support, sla,
                compliance
              </li>
              <li>
                <strong>Packaging/Dev Workflow:</strong> apt, packaging, build,
                toolchain
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Health Score */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Health Score Formula
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          The overall health score (0-100) is a weighted average of four
          component scores:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Component
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Weight
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Calculation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Responsiveness
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(weights.responsiveness * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  100 - (medianResponseHours /{' '}
                  {normalization.maxFirstResponseHours} * 100)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Closure Ratio
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(weights.closureRatio * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  (closedIssues / openedIssues) /{' '}
                  {normalization.maxClosureRatio} * 100
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Community Sentiment
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(weights.communitySentiment * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  Normalized sentiment from [{normalization.sentimentMin},{' '}
                  {normalization.sentimentMax}] to [0, 100]
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Complaint Severity
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(weights.complaintSeverity * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  100 - (negativeSharePercent * 2), capped at 50%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> If Reddit sentiment data is unavailable, the
            Community Sentiment weight is redistributed equally among the other
            three components.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Limitations
        </h2>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-ubuntu-orange font-bold">1.</span>
            <p className="text-sm text-gray-600">
              <strong>Rate Limiting:</strong> GitHub API limits unauthenticated
              requests. Setting a GITHUB_TOKEN environment variable increases
              limits significantly. Reddit may block requests entirely.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-ubuntu-orange font-bold">2.</span>
            <p className="text-sm text-gray-600">
              <strong>Sampling Bias:</strong> Time-to-first-response is
              calculated from a sample of issues (max 20 per repo) to stay
              within API limits. This may not be fully representative.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-ubuntu-orange font-bold">3.</span>
            <p className="text-sm text-gray-600">
              <strong>Sentiment Analysis:</strong> The AFINN-based lexicon is a
              simple deterministic approach. It may miss context, sarcasm, or
              domain-specific terminology.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-ubuntu-orange font-bold">4.</span>
            <p className="text-sm text-gray-600">
              <strong>RSS Limitations:</strong> Discourse RSS feeds only provide
              recent items and don&apos;t include engagement metrics like replies or
              likes.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-ubuntu-orange font-bold">5.</span>
            <p className="text-sm text-gray-600">
              <strong>30-Day Window:</strong> All metrics are based on a rolling
              30-day window. Seasonal patterns or one-time events may skew
              results.
            </p>
          </div>
        </div>
      </section>

      {/* Refresh Status */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Refresh Status Meanings
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ok
            </span>
            <p className="text-sm text-gray-600">
              All data sources fetched successfully.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              partial
            </span>
            <p className="text-sm text-gray-600">
              Some data sources failed (typically Reddit). Dashboard shows data
              from successful sources and previous cached data for failed ones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              fail
            </span>
            <p className="text-sm text-gray-600">
              Multiple critical sources failed. Dashboard may show stale or
              incomplete data.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Technical Details
        </h2>

        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Data Refresh:</strong> Data is refreshed daily via Vercel
            Cron (07:00 UTC) or manually via the Refresh button.
          </p>
          <p>
            <strong>Storage:</strong> Aggregated metrics are stored in Vercel KV
            (Redis). Only computed aggregates are stored, not raw data.
          </p>
          <p>
            <strong>Caching:</strong> API responses are served directly from KV
            for fast performance. No real-time fetching occurs on page load.
          </p>
          <p>
            <strong>Local Development:</strong> When KV is not configured, an
            in-memory store is used. Data persists only for the session.
          </p>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400">
        Last updated: February 2025
      </p>
    </div>
  )
}
