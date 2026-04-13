// netlify/functions/analyze.js
// Live analysis for custom events
// - Checks Turbopuffer for semantic duplicates first
// - Generates analysis + narration + music in parallel
// - Caches result in Turbopuffer for future dedup

// Simple rate limiting — max custom events per day
let dailyCount = 0
let dailyReset = Date.now()
const MAX_DAILY = 30

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  // Reset counter daily
  if (Date.now() - dailyReset > 86400000) {
    dailyCount = 0
    dailyReset = Date.now()
  }

  if (dailyCount >= MAX_DAILY) {
    return new Response(JSON.stringify({ rejected: true, reason: 'ReddX Industries has exceeded its daily caseload. Try a pre-loaded event from the carousel, or come back tomorrow.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  dailyCount++

  try {
    const { eventText } = await req.json()
    if (!eventText || eventText.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Event too short' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY

    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'No API key' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Analyze custom: "${eventText}"`)

    // === STEP 1: Check for semantic duplicate in custom-events namespace ===
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const dupRes = await fetch('https://api.turbopuffer.com/v2/namespaces/custom-events/query', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${TURBOPUFFER_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rank_by: ['text', 'BM25', eventText],
            top_k: 1,
            include_attributes: ['text', 'result'],
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (dupRes.ok) {
          const data = await dupRes.json()
          const rows = data.rows || []
          if (rows.length > 0 && rows[0].dist && rows[0].dist > 5.0) {
            // Strong BM25 match — serve cached result
            const cached = rows[0].attributes?.result
            if (cached) {
              console.log(`  Cache HIT: "${rows[0].attributes?.text?.substring(0, 50)}" (dist: ${rows[0].dist})`)
              const result = JSON.parse(cached)
              result._cached = true
              return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' },
              })
            }
          }
        }
      } catch (e) { /* namespace may not exist yet, that's fine */ }
    }

    // === STEP 2: Get historical parallels from main namespace ===
    let parallelsText = ''
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const tpRes = await fetch('https://api.turbopuffer.com/v2/namespaces/consequence-events/query', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${TURBOPUFFER_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rank_by: ['text', 'BM25', eventText],
            top_k: 3,
            include_attributes: ['event_name', 'consequences', 'year'],
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (tpRes.ok) {
          const data = await tpRes.json()
          const rows = data.rows || []
          if (rows.length > 0) {
            parallelsText = `\nHistorical parallels:\n${rows.map(p =>
              `- ${p.attributes?.event_name || p.id} (${p.attributes?.year || '?'}): ${p.attributes?.consequences || ''}`
            ).join('\n')}`
          }
        }
      } catch (e) { /* skip */ }
    }

    // === STEP 3: Claude analysis (with content check built in) ===
    let analysis = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const model = attempt < 3 ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001'
      console.log(`  Attempt ${attempt}/3 using ${model}`)
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            system: `You analyze ripple effects of world events for a conspiracy corkboard app called Timeline Manipulator by ReddX Industries.

CONTENT CHECK: If the event is hateful, promotes violence against specific people, or is genuinely harmful, respond with:
{"rejected": true, "reason": "Brief funny reason why you won't analyze this"}
Edgy humor and absurd hypotheticals are FINE. Actual hate speech is not.

For each ripple, include a source name (e.g. "Reuters", "CNN", "The Onion" for the mundane one). Just the publication name is fine.

Generate 5-7 consequences showing how it ripples through industries. Write narration scripts (YouTube rabbit-hole energy, sarcastic, 2-3 sentences each, NEVER use em dashes). Last ripple is always absurdly mundane. Narrator gets LIVID.

Also generate 3 strategic response choices (under 10 words each).
Also describe the music mood for noir jazz generation.

Respond with ONLY valid JSON.`,
            messages: [{
              role: 'user',
              content: `Analyze: "${eventText}"
${parallelsText}

Return JSON:
{
  "title": "dramatic punchy title",
  "subtitle": "one-line tagline",
  "category": "geopolitics|finance|media|logistics|culture|technology",
  "severity": 1-5,
  "tag": "speculative",
  "ripples": [
    { "id": 1, "headline": "headline", "domain": "energy|finance|consumer|personal|etc", "severity": 1-5, "delay": "hours|days|weeks|months", "source": { "title": "Publication Name" } }
  ],
  "narrations": ["script 1", "script 2", "...one per ripple"],
  "choices": ["option 1", "option 2", "option 3"],
  "symphony_arc": { "opening": "mood", "development": "build", "climax": "peak", "resolution": "settle" },
  "music_prompt": "One paragraph describing the noir jazz mood for this specific event"
}`
            }]
          })
        })

        if (claudeRes.status === 429) {
          console.log(`  Rate limited (attempt ${attempt}/3)`)
          await new Promise(r => setTimeout(r, 10000))
          continue
        }
        if (claudeRes.status === 529) {
          console.log(`  API overloaded (attempt ${attempt}/3)`)
          await new Promise(r => setTimeout(r, 3000))
          continue
        }
        if (claudeRes.status >= 500) {
          console.log(`  Server error ${claudeRes.status} (attempt ${attempt}/3)`)
          await new Promise(r => setTimeout(r, 3000))
          continue
        }
        if (!claudeRes.ok) {
          const errBody = await claudeRes.text()
          console.log(`  Claude error ${claudeRes.status}: ${errBody.substring(0, 300)}`)
          throw new Error(`Claude ${claudeRes.status}`)
        }

        const data = await claudeRes.json()
        const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
        console.log(`  Claude response (${text.length} chars): ${text.substring(0, 200)}`)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.log(`  No JSON found in response`)
          continue
        }

        try {
          analysis = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim())
        } catch (parseErr) {
          console.log(`  JSON parse failed: ${parseErr.message}`)
          console.log(`  Raw: ${jsonMatch[0].substring(0, 200)}`)
          continue
        }
        break
      } catch (err) {
        if (attempt === 3) throw err
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    if (!analysis) throw new Error('Analysis failed')

    // Content rejected?
    if (analysis.rejected) {
      return new Response(JSON.stringify(analysis), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`  Analyzed: ${analysis.ripples?.length || 0} ripples, "${analysis.title}"`)

    // === STEP 4: Cache in Turbopuffer for dedup ===
    if (TURBOPUFFER_KEY) {
      try {
        const cacheResult = { ...analysis }

        await fetch('https://api.turbopuffer.com/v2/namespaces/custom-events', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${TURBOPUFFER_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upsert_rows: [{
              id: Date.now().toString(),
              text: eventText,
              title: analysis.title || '',
              result: JSON.stringify(cacheResult),
            }],
            schema: {
              text: { type: 'string', full_text_search: true },
              title: { type: 'string' },
              result: { type: 'string' },
            }
          })
        })
        console.log(`  Cached in Turbopuffer`)
      } catch (e) {
        console.log(`  Cache store failed: ${e.message}`)
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Analyze crash:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
