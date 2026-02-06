# Ubuntu Ecosystem Health Dashboard

A public-facing dashboard that aggregates ecosystem signals for Ubuntu/Canonical from GitHub, Discourse, and Reddit.

## Features

- **Health Score**: Weighted composite score (0-100) based on responsiveness, closure ratio, sentiment, and complaint severity
- **GitHub Metrics**: Issue tracking across curated Ubuntu/Canonical repositories
- **Community Insights**: Discourse activity and Reddit sentiment analysis
- **Complaint Categorization**: Keyword-based classification into snaps/security, updates, performance, enterprise, and packaging categories
- **Graceful Degradation**: Dashboard continues working if individual sources fail

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts for visualizations
- Vercel KV (Redis) for persistence
- Zod for validation

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The app will run at http://localhost:3000.

**Note**: Without Vercel KV configured, the app uses an in-memory store. Data will be lost on restart.

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | No | GitHub PAT for higher rate limits (60 -> 5000 req/hr) |
| `CRON_SECRET` | Production | Protects cron endpoint |
| `KV_REST_API_URL` | For persistence | Vercel KV URL |
| `KV_REST_API_TOKEN` | For persistence | Vercel KV token |

### Connecting Vercel KV

1. Create a KV database in Vercel Dashboard
2. Link it to your project
3. Pull environment variables: `vercel env pull .env.local`

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ubuntu-dashboard)

1. Push to GitHub
2. Import in Vercel
3. Add a KV database from Vercel Dashboard
4. Set `CRON_SECRET` in environment variables
5. (Optional) Set `GITHUB_TOKEN` for higher rate limits

### Manual Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

## Data Refresh

- **Manual**: Click "Refresh Data" button on the Overview page
- **Automatic**: Vercel Cron runs daily at 07:00 UTC

First refresh may take 2-5 minutes as it fetches data from all sources.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/metrics/overview` | GET | Combined dashboard data |
| `/api/metrics/github` | GET | GitHub metrics (optional `?repo=owner/repo`) |
| `/api/metrics/community` | GET | Community data |
| `/api/refresh` | POST | Trigger manual refresh |
| `/api/cron/refresh` | GET | Cron endpoint (requires auth) |

## Project Structure

```
├── app/
│   ├── api/             # API routes
│   ├── github/          # GitHub page
│   ├── community/       # Community page
│   ├── methodology/     # Methodology page
│   └── page.tsx         # Overview page
├── components/          # React components
├── lib/
│   ├── fetchers/        # Data fetchers (GitHub, Discourse, Reddit)
│   ├── aggregations/    # Data aggregation logic
│   ├── scoring/         # Health score calculation
│   ├── store/           # KV store abstraction
│   ├── config.ts        # Configuration
│   └── refresh.ts       # Refresh orchestrator
├── types/               # TypeScript types & Zod schemas
└── __tests__/           # Unit tests
```

## Configuration

Edit `lib/config.ts` to customize:

- Tracked GitHub repositories
- Discourse RSS feeds
- Reddit subreddits
- Complaint keywords and buckets
- Health score weights

## Testing

```bash
# Run tests
pnpm test

# Run tests once
pnpm test:run
```

## Limitations

- GitHub API limits: 60 req/hr without token, 5000 with token
- Reddit may block requests (handled gracefully)
- Sentiment analysis uses simple lexicon-based approach
- 30-day rolling window for all metrics

See the [Methodology](/methodology) page for detailed explanations.

## License

MIT
