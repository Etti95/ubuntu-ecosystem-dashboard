// Simple AFINN-based sentiment analyzer
// Lexicon subset focused on tech/community discussions

const AFINN_LEXICON: Record<string, number> = {
  // Negative words
  abandon: -2,
  abandoned: -2,
  abuse: -3,
  abused: -3,
  annoying: -2,
  annoyed: -2,
  awful: -3,
  bad: -3,
  broke: -2,
  broken: -3,
  bug: -2,
  buggy: -3,
  crap: -3,
  crash: -2,
  crashed: -3,
  crashes: -2,
  critical: -2,
  damn: -2,
  dead: -2,
  deprecated: -1,
  difficult: -1,
  disappointing: -2,
  disappointed: -2,
  disaster: -3,
  dislike: -2,
  downgrade: -2,
  error: -2,
  errors: -2,
  fail: -2,
  failed: -2,
  failing: -2,
  failure: -2,
  fault: -2,
  freeze: -2,
  freezes: -2,
  frustrating: -3,
  frustrated: -3,
  glitch: -2,
  glitchy: -2,
  hate: -3,
  horrible: -3,
  impossible: -2,
  incompatible: -2,
  inconvenient: -2,
  issue: -1,
  issues: -1,
  lack: -1,
  lag: -2,
  laggy: -2,
  mess: -2,
  messy: -2,
  missing: -1,
  nightmare: -3,
  obsolete: -2,
  outdated: -1,
  pain: -2,
  painful: -2,
  poor: -2,
  problem: -2,
  problems: -2,
  regret: -2,
  remove: -1,
  removed: -1,
  risky: -2,
  sad: -2,
  security: -1,
  shit: -4,
  slow: -2,
  sucks: -3,
  terrible: -3,
  trouble: -2,
  ugly: -2,
  unable: -2,
  unacceptable: -3,
  unavailable: -1,
  unstable: -2,
  unusable: -3,
  useless: -3,
  virus: -3,
  vulnerable: -2,
  warning: -1,
  waste: -2,
  wasted: -2,
  weak: -2,
  worst: -3,
  wrong: -2,

  // Positive words
  amazing: 4,
  awesome: 4,
  beautiful: 3,
  best: 3,
  better: 2,
  brilliant: 4,
  clean: 2,
  cool: 2,
  correct: 1,
  easy: 2,
  elegant: 3,
  excellent: 3,
  excited: 3,
  fantastic: 4,
  fast: 2,
  favorite: 2,
  fine: 1,
  fix: 1,
  fixed: 2,
  free: 1,
  glad: 2,
  good: 2,
  great: 3,
  happy: 3,
  helpful: 2,
  impressed: 3,
  impressive: 3,
  improve: 2,
  improved: 2,
  improvement: 2,
  interesting: 2,
  like: 1,
  love: 3,
  loved: 3,
  lovely: 3,
  nice: 2,
  perfect: 3,
  pleased: 2,
  powerful: 2,
  pretty: 1,
  quick: 1,
  recommend: 2,
  reliable: 2,
  resolved: 2,
  responsive: 2,
  safe: 1,
  satisfactory: 1,
  satisfied: 2,
  secure: 2,
  simple: 1,
  sleek: 2,
  smooth: 2,
  solid: 2,
  solved: 2,
  stable: 2,
  success: 2,
  successful: 2,
  super: 3,
  thanks: 2,
  thank: 2,
  top: 1,
  update: 1,
  upgrade: 1,
  useful: 2,
  win: 2,
  wonderful: 3,
  works: 1,
  wow: 3,
  yay: 3,
}

// Negation words that flip sentiment
const NEGATION_WORDS = new Set([
  'not',
  'no',
  "don't",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "couldn't",
  "shouldn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  'never',
  'neither',
  'nobody',
  'nothing',
  'nowhere',
  'hardly',
  'barely',
  'scarcely',
])

// Intensifiers
const INTENSIFIERS: Record<string, number> = {
  very: 1.5,
  really: 1.5,
  extremely: 2,
  absolutely: 2,
  completely: 1.5,
  totally: 1.5,
  highly: 1.5,
  super: 1.5,
  incredibly: 2,
  somewhat: 0.5,
  slightly: 0.5,
  kind: 0.5,
  kinda: 0.5,
  pretty: 0.75,
}

export interface SentimentResult {
  score: number // -5 to 5 normalized
  comparative: number // score / word count
  positive: string[]
  negative: string[]
  tokens: number
}

export function analyzeSentiment(text: string): SentimentResult {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)

  let totalScore = 0
  const positive: string[] = []
  const negative: string[] = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    let wordScore = AFINN_LEXICON[word]

    if (wordScore === undefined) continue

    // Check for negation in previous 3 words
    let negated = false
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATION_WORDS.has(words[j])) {
        negated = true
        break
      }
    }

    if (negated) {
      wordScore = -wordScore * 0.5 // Flip and reduce intensity
    }

    // Check for intensifier in previous word
    const prevWord = words[i - 1]
    if (prevWord && INTENSIFIERS[prevWord]) {
      wordScore *= INTENSIFIERS[prevWord]
    }

    totalScore += wordScore

    if (wordScore > 0) {
      positive.push(word)
    } else if (wordScore < 0) {
      negative.push(word)
    }
  }

  // Normalize to -5 to 5 range
  const normalizedScore = Math.max(-5, Math.min(5, totalScore / 3))

  return {
    score: normalizedScore,
    comparative: words.length > 0 ? normalizedScore / words.length : 0,
    positive,
    negative,
    tokens: words.length,
  }
}

export function classifySentiment(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 0.5) return 'positive'
  if (score <= -0.5) return 'negative'
  return 'neutral'
}
