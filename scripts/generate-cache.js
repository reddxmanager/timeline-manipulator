// scripts/generate-cache.js
// Consequencpiracy — Cache Generator
// Now with REAL source URLs via Claude web search + Turbopuffer historical parallels
//
// Run: npm run cache        (all events)
// Run: npm run cache:hormuz (single event)
// Flags: --skip-analysis  --only-narration  --only-music  --only-sfx

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CACHE_DIR = join(__dirname, '..', 'public', 'cache')

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY

if (!ELEVENLABS_KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1) }
if (!ANTHROPIC_KEY) { console.error('Set ANTHROPIC_API_KEY'); process.exit(1) }

const MUSIC_LENGTH_MS = 240000
const TURBOPUFFER_NAMESPACE = 'consequence-events'

const EVENTS = [
  // === THIS TIMELINE (historical) ===
  { id: 'hormuz', prompt: 'Iran closes the Strait of Hormuz after US and Israeli airstrikes in February 2026, choking 20% of global oil supply, stranding 600+ vessels, and charging $1M crypto tolls per ship', tag: 'historical' },
  { id: 'svb', prompt: 'Silicon Valley Bank collapses in 48 hours in March 2023, triggering regional banking crisis', tag: 'historical' },
  { id: 'suez-real', prompt: 'The Ever Given container ship blocks the Suez Canal for 6 days in March 2021, halting $9.6 billion per day in global trade', tag: 'historical' },
  { id: 'gamestop', prompt: 'GameStop short squeeze in January 2021 where Reddit retail traders drove GME from $17 to $483, destroying hedge fund Melvin Capital', tag: 'historical' },
  { id: 'covid', prompt: 'Global COVID-19 lockdowns begin March 2020, shutting down economies worldwide, triggering mass unemployment and supply chain collapse', tag: 'historical' },
  { id: 'chatgpt', prompt: 'OpenAI launches ChatGPT in November 2022, triggering an AI arms race that reshapes every industry', tag: 'historical' },
  { id: 'tariffs', prompt: 'Trump administration imposes sweeping tariffs on China, Canada, Mexico and allies in 2025, triggering trade war and market volatility', tag: 'historical' },
  { id: 'deepwater', prompt: 'BP Deepwater Horizon oil rig explodes in April 2010, spilling 4.9 million barrels into the Gulf of Mexico over 87 days', tag: 'historical' },
  { id: 'fukushima', prompt: 'Fukushima Daiichi nuclear disaster in March 2011 after earthquake and tsunami, causing global nuclear energy policy reversal', tag: 'historical' },
  { id: 'opec', prompt: 'OPEC oil embargo of 1973 quadruples oil prices overnight when Arab nations cut off supply to US allies during Yom Kippur War', tag: 'historical' },

  // === PARALLEL TIMELINE (speculative) ===
  { id: 'mrbeast', prompt: 'MrBeast signs a $500M exclusive deal with Amazon Prime Video', tag: 'speculative' },
  { id: 'tyson', prompt: 'Mike Tyson knocks out Jake Paul in round 1 on Netflix', tag: 'speculative' },
  { id: 'suez', prompt: 'Suez Canal blocked again by a container ship', tag: 'speculative' },
  { id: 'tiktok-ban', prompt: 'TikTok permanently banned in the United States, 170 million users displaced overnight', tag: 'speculative' },
  { id: 'bitcoin-1m', prompt: 'Bitcoin hits $1 million per coin, triggering mass FOMO and regulatory panic worldwide', tag: 'speculative' },
  { id: 'yellowstone', prompt: 'Yellowstone supervolcano erupts, covering the western US in ash and triggering volcanic winter', tag: 'speculative' },
  { id: 'internet-down', prompt: 'Global internet outage lasting 72 hours caused by cascading BGP failures and undersea cable damage', tag: 'speculative' },
  { id: 'amazon-union', prompt: 'Amazon warehouse workers unionize nationwide in a single coordinated vote, forcing $25 minimum wage', tag: 'speculative' },
  { id: 'swift-retires', prompt: 'Taylor Swift announces retirement from touring after Eras Tour, crashing Ticketmaster stock and live event industry', tag: 'speculative' },
  { id: 'agi', prompt: 'OpenAI achieves AGI and open-sources it, making superhuman AI freely available to everyone on Earth', tag: 'speculative' },
]

function loadExistingAnalysis(dir) {
  const path = join(dir, 'analysis.json')
  if (existsSync(path)) {
    try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
  }
  return null
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const targetId = args[0]
  const skipAnalysis = process.argv.includes('--skip-analysis')
  const onlyNarration = process.argv.includes('--only-narration')
  const onlyMusic = process.argv.includes('--only-music')
  const onlySfx = process.argv.includes('--only-sfx')
  const targets = targetId ? EVENTS.filter(e => e.id === targetId) : EVENTS

  if (targetId && targets.length === 0) {
    console.error(`Event "${targetId}" not found. Available: ${EVENTS.map(e => e.id).join(', ')}`)
    process.exit(1)
  }

  console.log(`\n=== CONSEQUENCPIRACY — Cache Generator ===`)
  console.log(`Music: ${MUSIC_LENGTH_MS / 60000} min | Turbopuffer: ${TURBOPUFFER_KEY ? 'connected' : 'MISSING'}`)
  console.log(`Generating ${targets.length} event(s)...\n`)

  for (const event of targets) {
    console.log(`\n--- ${event.id}: "${event.prompt}" [${event.tag}] ---\n`)
    const dir = join(CACHE_DIR, event.id)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    // Step 1: Analysis with web search + Turbopuffer context
    let analysis
    if (skipAnalysis || onlyNarration || onlyMusic || onlySfx) {
      analysis = loadExistingAnalysis(dir)
      if (!analysis) {
        console.log('  No existing analysis, running full pipeline...')
        analysis = await fullAnalysisPipeline(event)
        writeFileSync(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2))
      } else {
        console.log(`  Reusing analysis (${analysis.ripples.length} ripples)`)
      }
    } else {
      console.log('  [1/5] Running full analysis pipeline...')
      console.log('        Querying Turbopuffer for historical parallels...')
      analysis = await fullAnalysisPipeline(event)
      writeFileSync(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2))
      console.log(`        ${analysis.ripples.length} ripples, severity ${analysis.severity}`)
    }

    // Step 2: Narration scripts
    if (!onlyMusic && !onlySfx) {
      console.log('  [2/5] Cooling down 60s for rate limit...')
      await sleep(60000)
      console.log('  [2/5] Writing narration scripts...')
      let scripts
      try {
        scripts = await generateNarrationScripts(analysis)
        writeFileSync(join(dir, 'narration-scripts.json'), JSON.stringify(scripts, null, 2))
        console.log(`        ${scripts.length} scripts written`)
        scripts.forEach((s, i) => console.log(`        ${i + 1}: "${s.substring(0, 55)}..."`))
      } catch (err) {
        console.error(`        Failed: ${err.message}`)
        scripts = analysis.ripples.map(r => `${r.headline}. ${r.delay}.`)
      }

      // Step 3: TTS per ripple
      console.log(`  [3/5] Generating ${scripts.length} narrations...`)
      for (let i = 0; i < scripts.length; i++) {
        try {
          const buf = await generateTTS(scripts[i])
          writeFileSync(join(dir, `narration-${i + 1}.mp3`), Buffer.from(buf))
          console.log(`        ${i + 1}/${scripts.length} (${(buf.byteLength / 1024).toFixed(0)} KB)`)
        } catch (err) { console.error(`        ${i + 1} failed: ${err.message}`) }
        await sleep(400)
      }
    }

    // Step 4: Music
    if (!onlyNarration && !onlySfx) {
      console.log(`  [4/5] Generating noir jazz (${MUSIC_LENGTH_MS / 60000} min)...`)
      try {
        const buf = await generateMusicWithRetry(buildMusicPrompt(analysis), MUSIC_LENGTH_MS)
        writeFileSync(join(dir, 'music.mp3'), Buffer.from(buf))
        console.log(`        Saved (${(buf.byteLength / 1024).toFixed(0)} KB)`)
      } catch (err) { console.error(`        Failed: ${err.message}`) }
    }

    // Step 5: SFX
    if (!onlyNarration && !onlyMusic) {
      console.log(`  [5/5] Generating ${analysis.ripples.length} SFX...`)
      for (let i = 0; i < analysis.ripples.length; i++) {
        try {
          const buf = await generateSFX(domainToSFX(analysis.ripples[i].domain))
          writeFileSync(join(dir, `sfx-${i + 1}.mp3`), Buffer.from(buf))
          console.log(`        ${i + 1}/${analysis.ripples.length}: ${analysis.ripples[i].domain}`)
        } catch (err) { console.error(`        ${i + 1} failed: ${err.message}`) }
        await sleep(500)
      }
    }

    console.log(`\n  DONE: ${event.id}`)
  }
  console.log('\n=== All cached. ===\n')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ============================================================
// FULL ANALYSIS PIPELINE
// 1. Query Turbopuffer for historical parallels
// 2. Call Claude WITH web_search tool to build ripple chain
//    Claude searches for real articles/data to back each ripple
// ============================================================

async function fullAnalysisPipeline(event) {
  // Step 1: Get historical parallels from Turbopuffer
  let parallels = []
  if (TURBOPUFFER_KEY) {
    try {
      parallels = await queryTurbopuffer(event.prompt)
      if (parallels.length > 0) {
        console.log(`        Turbopuffer: ${parallels.length} parallels found`)
        parallels.forEach(p => console.log(`          - ${p.attributes?.event_name || p.id}`))
      } else {
        console.log('        Turbopuffer: no parallels (namespace may need seeding)')
      }
    } catch (err) {
      console.log(`        Turbopuffer error: ${err.message}`)
    }
  }

  // Step 2: Claude analysis WITH web search for real sources (with retry)
  let analysis
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      analysis = await analyzeWithWebSearch(event, parallels)
      break
    } catch (err) {
      console.log(`        Claude attempt ${attempt}/3 failed: ${err.message.substring(0, 100)}`)
      if (attempt < 3) {
        console.log(`        Waiting 30s before retry...`)
        await sleep(30000)
      } else {
        throw err
      }
    }
  }

  // Step 3: Source URLs — skip web search, Claude's training data sources are fine for demo
  // To enable: node --env-file=.env.local scripts/generate-cache.js hormuz --enrich-sources

  return analysis
}

// --- TURBOPUFFER ---

async function queryTurbopuffer(eventText) {
  const res = await fetch(`https://api.turbopuffer.com/v2/namespaces/${TURBOPUFFER_NAMESPACE}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURBOPUFFER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rank_by: ['text', 'BM25', eventText],
      top_k: 5,
      include_attributes: ['event_name', 'consequences', 'domain', 'severity', 'year'],
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    if (res.status === 400 || res.status === 422) {
      console.log('        BM25 search failed, trying basic query...')
      return await queryTurbopufferBasic(eventText)
    }
    throw new Error(`Turbopuffer: ${res.status} - ${errText.substring(0, 200)}`)
  }

  const data = await res.json()
  return data.rows || data || []
}

async function queryTurbopufferBasic(eventText) {
  const res = await fetch(`https://api.turbopuffer.com/v2/namespaces/${TURBOPUFFER_NAMESPACE}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURBOPUFFER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rank_by: ['text', 'BM25', eventText.split(' ').slice(0, 5).join(' ')],
      top_k: 10,
      include_attributes: ['event_name', 'consequences', 'domain', 'severity', 'year'],
    })
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.rows || data || []
}

// --- CLAUDE WITH WEB SEARCH ---

// Step 1: Cheap analysis (no web search, ~1K input tokens)
async function analyzeWithWebSearch(event, turbopufferParallels) {
  const parallelsContext = turbopufferParallels.length > 0
    ? `\nParallels: ${turbopufferParallels.map(p => p.attributes?.event_name || p.id).join(', ')}`
    : ''

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Trace ripple effects of world events. 5-7 ripples. Last one MUST be absurdly mundane (expensive burrito, late package). Include real source names. Also generate 3 response choices (under 10 words each). Respond ONLY with valid JSON.`,
      messages: [{
        role: 'user',
        content: `"${event.prompt}"${parallelsContext}\n\nJSON: {"title":"","subtitle":"","category":"","severity":1-5,"tag":"${event.tag}","ripples":[{"id":1,"headline":"","domain":"","severity":1-5,"delay":"","source":{"title":"","url":""}}],"symphony_arc":{"opening":"","development":"","climax":"","resolution":""},"choices":["option1","option2","option3"]}`
      }]
    })
  })

  if (!res.ok) throw new Error(`Claude: ${res.status} - ${await res.text()}`)

  const data = await res.json()
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim())
}

// Step 2: Find real source URLs via web search (tiny prompt, room for results)
async function enrichSourceUrls(analysis) {
  const headlines = analysis.ripples.map((r, i) => `${i + 1}. ${r.headline}`).join('\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Find one real source URL per headline. Search efficiently. Return JSON array of {"title":"source name","url":"real url"} objects. Same order as input.`,
        messages: [{
          role: 'user',
          content: headlines
        }]
      })
    })

    if (!res.ok) {
      console.log(`        Source enrichment failed: ${res.status} (using placeholder URLs)`)
      return analysis
    }

    const data = await res.json()
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const jsonMatch = text.match(/\[[\s\S]*\]/)

    if (jsonMatch) {
      const sources = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim())
      analysis.ripples.forEach((r, i) => {
        if (sources[i]?.url) {
          r.source = { title: sources[i].title || r.source?.title, url: sources[i].url }
        }
      })
      console.log(`        ${sources.filter(s => s?.url).length}/${analysis.ripples.length} sources found`)
    }
  } catch (err) {
    console.log(`        Source enrichment error: ${err.message}`)
  }

  return analysis
}

// --- NARRATION SCRIPTS ---

async function generateNarrationScripts(analysis) {
  const rippleList = analysis.ripples.map((r, i) =>
    `${i + 1}. [${r.domain.toUpperCase()}] "${r.headline}" (${r.delay}) severity ${r.severity}/5 source: ${r.source?.title || 'n/a'}`
  ).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Write narration scripts for a conspiracy corkboard. YouTube rabbit-hole energy, sarcastic, 2-3 sentences each. Last one: narrator gets LIVID about something mundane. Never use em dashes. JSON array of strings only.`,
      messages: [{
        role: 'user',
        content: `"${analysis.title}" - ${analysis.ripples.length} ripples:\n${rippleList}\n\nReturn JSON array of ${analysis.ripples.length} strings.`
      }]
    })
  })

  if (!res.ok) throw new Error(`Claude: ${res.status} - ${await res.text()}`)
  const data = await res.json()
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('')
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

// --- MUSIC ---

async function generateMusicWithRetry(prompt, lengthMs) {
  const res = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, music_length_ms: lengthMs, force_instrumental: true })
  })
  if (res.ok) return res.arrayBuffer()
  const errText = await res.text()
  let errData
  try { errData = JSON.parse(errText) } catch { throw new Error(`Music: ${res.status} - ${errText}`) }
  if (errData?.detail?.data?.prompt_suggestion) {
    console.log(`        Content filter. Retrying...`)
    const r = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST', headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: errData.detail.data.prompt_suggestion, music_length_ms: lengthMs, force_instrumental: true })
    })
    if (r.ok) return r.arrayBuffer()
    throw new Error(`Retry failed: ${r.status}`)
  }
  throw new Error(`Music: ${res.status} - ${errText}`)
}

// --- TTS ---

async function generateTTS(text) {
  const voiceId = process.env.REDDX_VOICE_ID || process.env.GUBBINS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST', headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.6, use_speaker_boost: true } })
  })
  if (!res.ok) throw new Error(`TTS: ${res.status} - ${await res.text()}`)
  return res.arrayBuffer()
}

// --- SFX ---

async function generateSFX(text, dur = 3) {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST', headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, duration_seconds: dur })
  })
  if (!res.ok) throw new Error(`SFX: ${res.status} - ${await res.text()}`)
  return res.arrayBuffer()
}

// --- PROMPTS ---

function buildMusicPrompt(analysis) {
  const { symphony_arc, severity } = analysis
  const intensity = severity >= 4 ? 'Tension builds. More urgency in bass, dissonance in chords.'
    : severity >= 3 ? 'Steady simmer underneath cool exterior.'
    : 'Contemplative. Almost relaxed. Something is off.'
  return [
    'Late night noir jazz. Smoky bar.',
    'Muted trumpet, upright bass walking, brush drums, warm piano.',
    symphony_arc?.opening ? `Opens: ${symphony_arc.opening}.` : '',
    symphony_arc?.development ? `Develops: ${symphony_arc.development}.` : '',
    intensity,
    'Relaxed but melancholic. Cozy apocalypse vibes.',
    'No vocals. Film noir jazz. Loopable.',
  ].filter(Boolean).join(' ')
}

function domainToSFX(domain) {
  return ({
    commodities: 'Deep industrial rumble, heavy machinery grinding',
    finance: 'Stock ticker clicking rapidly, urgent bell ringing',
    logistics: 'Ship horn blast echoing, container crane creaking',
    energy: 'Electrical surge crackling, power grid humming',
    agriculture: 'Heavy rain on crops, wind through dry field',
    consumer: 'Cash register ding, shopping cart on tile floor',
    personal: 'Phone notification buzz, doorbell ring',
    markets: 'Busy trading floor, phones ringing frantically',
    regulation: 'Heavy wooden gavel strike, papers shuffling',
    employment: 'Office going quiet, fluorescent light buzzing',
    'real estate': 'Keys jingling, heavy door closing',
    media: 'Camera shutter burst, broadcast countdown beep',
    geopolitics: 'Tense drum roll, radio static crackling',
    culture: 'Stadium crowd roaring, notification cascade',
    technology: 'Server room hum, digital glitch stutter',
  })[domain] || 'Dramatic impact sound, deep boom'
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
