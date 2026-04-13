// scripts/fetch-photos.js
// Downloads one stock photo per domain from Pexels
// Run: node --env-file=.env.local scripts/fetch-photos.js

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PHOTO_DIR = join(__dirname, '..', 'public', 'photos')

const PEXELS_KEY = process.env.PEXELS_API_KEY

const DOMAIN_SEARCHES = {
  energy: 'oil barrel industrial',
  finance: 'stock market trading screen',
  logistics: 'shipping container port',
  consumer: 'grocery store shelf',
  personal: 'coffee shop counter',
  markets: 'wall street building',
  agriculture: 'wheat field harvest',
  technology: 'server room cables',
  employment: 'empty office desk',
  regulation: 'courtroom gavel',
  media: 'newspaper stack',
  geopolitics: 'world map pins',
  culture: 'concert crowd',
  manufacturing: 'factory floor',
  commodities: 'gold bars vault',
  'real estate': 'house for sale sign',
  advertising: 'billboard city',
}

async function fetchPhoto(query, filename) {
  if (existsSync(join(PHOTO_DIR, filename))) {
    console.log(`  SKIP ${filename} (exists)`)
    return
  }

  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&size=small`, {
    headers: { 'Authorization': PEXELS_KEY }
  })

  if (!res.ok) {
    console.log(`  FAIL ${filename}: ${res.status}`)
    return
  }

  const data = await res.json()
  if (!data.photos || data.photos.length === 0) {
    console.log(`  EMPTY ${filename}: no results for "${query}"`)
    return
  }

  // Download the small version (landscape, ~300px wide)
  const photoUrl = data.photos[0].src.small
  const imgRes = await fetch(photoUrl)
  if (!imgRes.ok) {
    console.log(`  FAIL ${filename}: image download failed`)
    return
  }

  const buf = Buffer.from(await imgRes.arrayBuffer())
  writeFileSync(join(PHOTO_DIR, filename), buf)
  console.log(`  OK ${filename} (${(buf.length / 1024).toFixed(0)} KB) - "${query}"`)
}

async function main() {
  if (!PEXELS_KEY) {
    console.error('Missing PEXELS_API_KEY in .env.local')
    process.exit(1)
  }

  mkdirSync(PHOTO_DIR, { recursive: true })
  console.log(`\nFetching domain photos from Pexels...\n`)

  for (const [domain, query] of Object.entries(DOMAIN_SEARCHES)) {
    await fetchPhoto(query, `${domain}.jpg`)
    await new Promise(r => setTimeout(r, 200)) // rate limit courtesy
  }

  console.log(`\nDone. Photos saved to public/photos/`)
}

main()
