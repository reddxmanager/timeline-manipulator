// netlify/functions/branch.js
// Live branching with retry + graceful fallback

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  try {
    const body = await req.json()
    const { eventTitle, ripples, userChoice } = body

    if (!userChoice || !eventTitle) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'No API key' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Turbopuffer parallels (3s timeout, non-blocking)
    let parallelsText = ''
    const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const tpRes = await fetch('https://api.turbopuffer.com/v2/namespaces/consequence-events/query', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${TURBOPUFFER_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rank_by: ['text', 'BM25', userChoice],
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
              `- ${p.attributes?.event_name || p.id} (${p.attributes?.year || '?'})`
            ).join('\n')}`
          }
        }
      } catch (e) { /* skip */ }
    }

    const chainSummary = ripples
      ? ripples.slice(-4).map((r, i) => `${i + 1}. ${r.headline}`).join('\n')
      : ''

    console.log(`Branch: "${userChoice}" for "${eventTitle}"`)

    // Claude with retry (up to 3 attempts)
    let branch = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: attempt < 3 ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            system: `You generate 3-4 branching consequences for Timeline Manipulator by ReddX Industries. The user chose a response to a crisis.

Rules:
- Each consequence: punchy headline, domain, severity 1-5, delay
- Write a narration script for each (2-3 sentences, YouTube energy, sarcastic)
- LAST consequence is ALWAYS absurdly mundane. Narrator gets LIVID about something trivial.
- NEVER use em dashes
- Respond with ONLY valid JSON. No markdown.`,
            messages: [{
              role: 'user',
              content: `Event: "${eventTitle}"
Recent consequences: ${chainSummary}
${parallelsText}
User chose: "${userChoice}"

Return JSON:
{
  "branch_title": "short title",
  "ripples": [
    {"id":1,"headline":"consequence","domain":"energy","severity":3,"delay":"weeks","source":{"title":"source","url":"https://example.com"}}
  ],
  "narrations": ["script 1","script 2","script 3"],
  "roast": "One sentence roasting the user"
}`
            }]
          })
        })

        if (claudeRes.status === 429) {
          console.log(`  Rate limited (attempt ${attempt}/3), waiting 10s...`)
          await new Promise(r => setTimeout(r, 10000))
          continue
        }

        if (claudeRes.status >= 500) {
          console.log(`  Claude ${claudeRes.status} (attempt ${attempt}/3), retrying...`)
          await new Promise(r => setTimeout(r, 3000))
          continue
        }

        if (!claudeRes.ok) {
          const err = await claudeRes.text()
          console.error('Claude error:', claudeRes.status, err.substring(0, 200))
          throw new Error(`Claude ${claudeRes.status}`)
        }

        const claudeData = await claudeRes.json()
        const text = claudeData.content.filter(b => b.type === 'text').map(b => b.text).join('')
        const jsonMatch = text.match(/\{[\s\S]*\}/)

        if (!jsonMatch) {
          console.error('No JSON, retrying...')
          continue
        }

        branch = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim())
        break // success

      } catch (err) {
        console.error(`  Attempt ${attempt} error:`, err.message)
        if (attempt === 3) throw err
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    if (!branch) {
      throw new Error('All retries failed')
    }

    console.log(`Branch generated: ${branch.ripples?.length || 0} ripples`)

    return new Response(JSON.stringify(branch), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Branch crash:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
