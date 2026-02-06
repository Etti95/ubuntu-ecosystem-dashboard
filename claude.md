# Claude Code Instructions for Ubuntu Ecosystem Dashboard

## Project Overview
This is a Vercel-hosted dashboard that aggregates public ecosystem signals for Ubuntu/Canonical from GitHub, Discourse, and Reddit.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts for visualizations
- Vercel KV (Redis) for persistence
- Zod for validation
- Vitest for testing

## Build & Development

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Tests
```bash
npm run test:run
```

## Project Structure
- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Core logic (fetchers, aggregations, scoring, store)
- `types/` - TypeScript types and Zod schemas
- `__tests__/` - Unit tests

## Key Features
- Health Score (0-100) with weighted components
- GitHub metrics from canonical/ubuntu repositories
- Discourse RSS topic tracking
- Reddit sentiment analysis with graceful degradation
- Vercel KV for persistence with in-memory fallback
- Daily cron refresh at 07:00 UTC

## Environment Variables
- `GITHUB_TOKEN` - Optional, for higher GitHub API rate limits
- `CRON_SECRET` - Required in production for cron endpoint protection
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` - Vercel KV credentials

## Important Instructions

### Commit Messages
- **NEVER** include `Co-Authored-By: Claude` or similar attribution lines in commit messages
- Keep commit messages concise and descriptive

### Code Style
- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Handle errors gracefully (especially for external API calls)
- Reddit fetcher must fail gracefully without breaking the dashboard

### Testing
- Run tests before committing: `npm run test:run`
- All 62 tests should pass
