import { getGitHubOverview } from '@/lib/fetchers/github'
import { CONFIG } from '@/lib/config'
import GitHubClient from './GitHubClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function GitHubPage() {
  const overview = await getGitHubOverview()
  const repos = CONFIG.github.repos.map((r) => `${r.owner}/${r.repo}`)

  return <GitHubClient overview={overview} availableRepos={repos} />
}
