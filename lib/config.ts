// Ubuntu Ecosystem Health Dashboard Configuration

export const CONFIG = {
  // GitHub repositories to track
  github: {
    repos: [
      { owner: 'canonical', repo: 'snapd' },
      { owner: 'canonical', repo: 'multipass' },
      { owner: 'canonical', repo: 'cloud-init' },
      { owner: 'ubuntu', repo: 'ubuntu-make' },
      { owner: 'ubuntu', repo: 'gnome-shell-extension-appindicator' },
    ],
    // Days of data to collect
    lookbackDays: 30,
    // Rate limiting settings
    requestDelayMs: 100,
    maxRetries: 3,
  },

  // Discourse RSS feeds
  discourse: {
    feeds: [
      {
        name: 'Ubuntu Discourse Latest',
        url: 'https://discourse.ubuntu.com/latest.rss',
      },
      {
        name: 'Ubuntu Discourse Top',
        url: 'https://discourse.ubuntu.com/top.rss',
      },
    ],
    lookbackDays: 30,
  },

  // Reddit subreddits (best-effort, may fail)
  reddit: {
    subreddits: ['Ubuntu', 'linux', 'linuxquestions'],
    postsPerSubreddit: 100,
    requestDelayMs: 2000, // Be conservative with Reddit
    maxRetries: 2,
  },

  // Keywords for tagging
  keywords: {
    general: [
      'canonical',
      'ubuntu',
      'snap',
      'snapd',
      'apt',
      'lxd',
      'multipass',
      'update',
      'upgrade',
      'security',
      'performance',
    ],
    complaintBuckets: {
      snaps_security: ['snap', 'snapd', 'store', 'malware', 'security', 'sandbox'],
      updates_breakage: ['update', 'upgrade', 'broke', 'broken', 'dependency', 'fail'],
      performance: ['slow', 'performance', 'lag', 'cpu', 'memory', 'ram', 'freeze'],
      enterprise_support: ['enterprise', 'support', 'sla', 'compliance', 'lts'],
      packaging_dev_workflow: ['apt', 'packaging', 'build', 'dependency', 'toolchain', 'ppa'],
    },
  },

  // Health score weights (must sum to 1.0)
  healthScore: {
    weights: {
      responsiveness: 0.35,
      closureRatio: 0.25,
      communitySentiment: 0.20,
      complaintSeverity: 0.20,
    },
    // Normalization bounds
    normalization: {
      // Max hours for first response (168h = 1 week)
      maxFirstResponseHours: 168,
      // Max ratio for closure (capped at 1.2)
      maxClosureRatio: 1.2,
      // Sentiment bounds (AFINN-based, roughly -5 to +5)
      sentimentMin: -3,
      sentimentMax: 3,
    },
  },

  // Cache TTL settings (in seconds)
  cache: {
    overviewTtl: 3600, // 1 hour
    detailTtl: 1800, // 30 minutes
  },
} as const

export type ComplaintBucket = keyof typeof CONFIG.keywords.complaintBuckets
