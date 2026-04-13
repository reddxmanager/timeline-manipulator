// scripts/seed-turbopuffer.js
// Seeds Turbopuffer with historical event data for BM25 full-text search.
// Run: node --env-file=.env.local scripts/seed-turbopuffer.js

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY
const NAMESPACE = 'consequence-events'
const API_BASE = 'https://api.turbopuffer.com/v2'

if (!TURBOPUFFER_KEY) {
  console.error('Set TURBOPUFFER_API_KEY in .env.local')
  process.exit(1)
}

async function main() {
  const seedPath = join(__dirname, '..', 'data', 'seed-events.json')
  const events = JSON.parse(readFileSync(seedPath, 'utf8'))

  console.log(`\n=== CONSEQUENCPIRACY — Turbopuffer Seeder ===`)
  console.log(`Namespace: ${NAMESPACE}`)
  console.log(`Events to seed: ${events.length}\n`)

  // Build rows for v2 API
  // v2 format: upsert_rows is an array of flat objects with id + attribute keys
  const rows = events.map(event => ({
    id: event.id,
    text: [event.event, ...event.consequences].join('. '),
    event_name: event.event,
    consequences: JSON.stringify(event.consequences),
    domain: event.domain,
    severity: event.severity,
    year: event.year,
  }))

  console.log('  Upserting documents with v2 API...')

  // POST /v2/namespaces/{namespace}
  // v2 uses upsert_rows (not upserts), flat attribute keys (not nested)
  const res = await fetch(`${API_BASE}/namespaces/${NAMESPACE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURBOPUFFER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upsert_rows: rows,
      schema: {
        text: { type: 'string', full_text_search: true },
        event_name: { type: 'string' },
        consequences: { type: 'string' },
        domain: { type: 'string' },
        severity: { type: 'uint' },
        year: { type: 'uint' },
      }
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`  FAILED: ${res.status}`)
    console.error(`  ${errText.substring(0, 500)}`)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`  Success! Response: ${JSON.stringify(data).substring(0, 200)}`)

  // Verify with a BM25 query
  console.log('\n  Verifying with test query: "oil crisis shipping"...')
  const testRes = await fetch(`${API_BASE}/namespaces/${NAMESPACE}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURBOPUFFER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rank_by: ['text', 'BM25', 'oil crisis shipping disruption'],
      top_k: 3,
      include_attributes: ['event_name', 'year', 'domain'],
    })
  })

  if (testRes.ok) {
    const results = await testRes.json()
    console.log('  Results:')
    const rows = results.rows || results
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        const attrs = r.attributes || r
        console.log(`    - [${attrs.domain}] ${attrs.event_name} (${attrs.year})`)
      })
    } else {
      console.log(`    ${JSON.stringify(results).substring(0, 300)}`)
    }
  } else {
    const err = await testRes.text()
    console.log(`  Query failed: ${testRes.status} - ${err.substring(0, 200)}`)
  }

  console.log('\n=== Done. ===\n')
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
