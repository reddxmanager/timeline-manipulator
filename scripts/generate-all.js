// scripts/generate-all.js
// Runs all event caches sequentially with delays between each
// Run: node --env-file=.env.local scripts/generate-all.js

import { execSync } from 'child_process'

const EVENTS = [
  'chatgpt',    // failed last time, do first
  'gamestop',
  'svb',
  'suez-real',
  'tariffs',
  'deepwater',
  'fukushima',
  'opec',
  // speculative
  'mrbeast',
  'tyson',
  'suez',
  'tiktok-ban',
  'bitcoin-1m',
  'yellowstone',
  'internet-down',
  'amazon-union',
  'swift-retires',
  'agi',
]

// Skip events that already have analysis.json + narration-scripts.json
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log(`\n=== BATCH CACHE GENERATOR ===`)
  console.log(`${EVENTS.length} events queued\n`)

  for (let i = 0; i < EVENTS.length; i++) {
    const id = EVENTS[i]
    const cacheDir = join(__dirname, '..', 'public', 'cache', id)
    const hasAnalysis = existsSync(join(cacheDir, 'analysis.json'))
    const hasNarration = existsSync(join(cacheDir, 'narration-scripts.json'))
    const hasMusic = existsSync(join(cacheDir, 'music.mp3'))

    if (hasAnalysis && hasNarration && hasMusic) {
      console.log(`[${i + 1}/${EVENTS.length}] ${id} — SKIP (already cached)`)
      continue
    }

    console.log(`\n[${i + 1}/${EVENTS.length}] ${id} — GENERATING...`)
    console.log(`  (${EVENTS.length - i - 1} remaining after this)\n`)

    try {
      execSync(`node --env-file=.env.local scripts/generate-cache.js ${id}`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      })
    } catch (err) {
      console.error(`\n  !! ${id} FAILED — skipping to next\n`)
    }

    // Wait 30s between events
    if (i < EVENTS.length - 1) {
      console.log(`\n  Waiting 30s before next event...`)
      await sleep(30000)
    }
  }

  console.log('\n=== BATCH COMPLETE ===\n')

  // Report what we have
  console.log('Cache status:')
  for (const id of ['hormuz', 'covid', ...EVENTS]) {
    const dir = join(__dirname, '..', 'public', 'cache', id)
    const a = existsSync(join(dir, 'analysis.json')) ? '✓' : '✗'
    const n = existsSync(join(dir, 'narration-scripts.json')) ? '✓' : '✗'
    const m = existsSync(join(dir, 'music.mp3')) ? '✓' : '✗'
    console.log(`  ${id}: analysis=${a} narration=${n} music=${m}`)
  }
}

main()
