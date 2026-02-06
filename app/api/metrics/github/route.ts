import { NextRequest, NextResponse } from 'next/server'
import { getGitHubOverview, getGitHubRepoData } from '@/lib/fetchers/github'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repo = searchParams.get('repo')

    if (repo) {
      // Parse owner/repo format
      const parts = repo.split('/')
      if (parts.length !== 2) {
        return NextResponse.json(
          { error: 'Invalid repo format. Use owner/repo' },
          { status: 400 }
        )
      }

      const [owner, repoName] = parts
      const repoData = await getGitHubRepoData(owner, repoName)

      if (!repoData) {
        return NextResponse.json(
          { error: 'Repo data not found. Try refreshing.' },
          { status: 404 }
        )
      }

      return NextResponse.json(repoData)
    }

    // Return overview if no specific repo requested
    const overview = await getGitHubOverview()

    if (!overview) {
      return NextResponse.json(
        { error: 'GitHub data not found. Try refreshing.' },
        { status: 404 }
      )
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching GitHub data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    )
  }
}
