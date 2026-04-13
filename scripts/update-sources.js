// scripts/update-sources.js
// Searches DuckDuckGo for each ripple headline and updates source URLs
// Run: node scripts/update-sources.js
// Resume-safe: skips events that already have updated sources

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', 'public', 'cache')

// Stagger: 2s between searches, 5s between events
const SEARCH_DELAY = 2000
const EVENT_DELAY = 5000

async function searchDDG(query, attempt = 1) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    })
    if (!res.ok) {
      if (attempt < 3) {
        console.log(`    Retry ${attempt}/3 (${res.status})...`)
        await new Promise(r => setTimeout(r, 5000 * attempt))
        return searchDDG(query, attempt + 1)
      }
      return null
    }

    const html = await res.text()

    // Check if we got a CAPTCHA/block page
    if (html.includes('bot') && html.length < 5000) {
      if (attempt < 3) {
        console.log(`    Blocked, waiting 10s and retrying...`)
        await new Promise(r => setTimeout(r, 10000))
        return searchDDG(query, attempt + 1)
      }
      return null
    }

    const results = []
    const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(html)) !== null && results.length < 3) {
      let href = match[1]
      const uddg = href.match(/uddg=([^&]+)/)
      if (uddg) href = decodeURIComponent(uddg[1])
      const title = match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
      if (title && href.startsWith('http')) results.push({ title, url: href })
    }
    return results.length > 0 ? results[0] : null
  } catch (e) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 5000))
      return searchDDG(query, attempt + 1)
    }
    return null
  }
}

function isAlreadyUpdated(analysis) {
  // Check if sources look like real DDG results (not Claude-generated)
  // Claude tends to use wsj.com, reuters.com etc with plausible paths
  // DDG results have more varied domains
  // Simple heuristic: if any source title contains HTML entities or is > 60 chars, it's from DDG
  if (!analysis.ripples) return false
  const updated = analysis.ripples.filter(r =>
    r.source?.url && !r.source.url.includes('example.com') && r.source.title?.length > 60
  )
  return updated.length >= analysis.ripples.length / 2
}

async function main() {
  const dirs = readdirSync(CACHE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  // Allow filtering by event name: node scripts/update-sources.js chatgpt covid
  const filter = process.argv.slice(2)
  const targetDirs = filter.length > 0 ? dirs.filter(d => filter.includes(d)) : dirs

  console.log(`\nUpdating sources for ${targetDirs.length} events...\n`)

  let totalUpdated = 0
  let totalRipples = 0

  for (const eventDir of targetDirs) {
    const analysisPath = join(CACHE_DIR, eventDir, 'analysis.json')
    let analysis
    try {
      analysis = JSON.parse(readFileSync(analysisPath, 'utf-8'))
    } catch { continue }

    if (!analysis.ripples) continue

    if (isAlreadyUpdated(analysis)) {
      console.log(`${eventDir}: SKIP (already updated)`)
      continue
    }

    console.log(`${eventDir}: ${analysis.ripples.length} ripples`)
    let updated = 0

    for (const ripple of analysis.ripples) {
      const query = `${ripple.headline}`
      const result = await searchDDG(query)

      if (result) {
        ripple.source = { title: result.title.substring(0, 100), url: result.url }
        updated++
        console.log(`  [${ripple.id}] ${result.title.substring(0, 55)}...`)
      } else {
        console.log(`  [${ripple.id}] No results`)
      }

      await new Promise(r => setTimeout(r, SEARCH_DELAY))
    }

    writeFileSync(analysisPath, JSON.stringify(analysis, null, 2))
    console.log(`  Updated ${updated}/${analysis.ripples.length}\n`)
    totalUpdated += updated
    totalRipples += analysis.ripples.length

    // Longer pause between events
    await new Promise(r => setTimeout(r, EVENT_DELAY))
  }

  console.log(`\nDone! Updated ${totalUpdated}/${totalRipples} total sources`)
}

main()
