// scripts/test-music.js
// Test noir jazz styles for Symphony of Consequence
// Run: node --env-file=.env.local scripts/test-music.js

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUT_DIR = join(__dirname, '..', 'public', 'cache', 'test')
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
if (!ELEVENLABS_KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1) }

async function generateAndSave(name, body) {
  console.log(`\n--- ${name} ---`)
  const res = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    console.log(`  FAILED: ${res.status}`)
    try {
      const parsed = JSON.parse(err)
      const suggestion = parsed?.detail?.data?.prompt_suggestion || parsed?.detail?.data?.composition_plan_suggestion
      if (suggestion) {
        console.log('  Retrying with suggestion...')
        const retryBody = typeof suggestion === 'string'
          ? { prompt: suggestion, music_length_ms: body.music_length_ms || 30000, force_instrumental: true }
          : { composition_plan: suggestion, force_instrumental: true }
        const retryRes = await fetch('https://api.elevenlabs.io/v1/music', {
          method: 'POST',
          headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(retryBody)
        })
        if (retryRes.ok) {
          const buf = await retryRes.arrayBuffer()
          writeFileSync(join(OUT_DIR, `${name}.mp3`), Buffer.from(buf))
          console.log(`  Saved (via suggestion): ${name}.mp3 (${(buf.byteLength / 1024).toFixed(0)} KB)`)
          return
        }
        console.log(`  Retry also failed: ${retryRes.status}`)
      }
    } catch {}
    return
  }

  const buf = await res.arrayBuffer()
  writeFileSync(join(OUT_DIR, `${name}.mp3`), Buffer.from(buf))
  console.log(`  Saved: ${name}.mp3 (${(buf.byteLength / 1024).toFixed(0)} KB)`)
}

async function main() {
  console.log('\n=== NOIR JAZZ MUSIC TESTS ===')
  console.log('=== "yes we\'re all screwed but enjoy the scotch" ===\n')

  await generateAndSave('noir-smoky', {
    prompt: 'Late night smoky jazz bar. Muted trumpet, upright bass walking line, soft brush drums, warm piano chords. Relaxed but melancholic. Like having a drink while the world quietly falls apart. No vocals.',
    music_length_ms: 30000,
    force_instrumental: true,
  })

  await generateAndSave('noir-tension', {
    prompt: 'Noir jazz that slowly builds tension. Starts with solo piano and brushed snare. Upright bass enters. Saxophone joins with a winding melody. Subtle dissonance creeps in. Reading classified documents at 2am with a glass of whiskey. Smooth but uneasy. No vocals.',
    music_length_ms: 30000,
    force_instrumental: true,
  })

  await generateAndSave('noir-plan', {
    composition_plan: {
      sections: [
        { type: "intro", description: "Solo upright bass walking line. Muted trumpet plays one long note. Smoke-filled room. Film noir opening.", duration_ms: 8000 },
        { type: "verse", description: "Piano enters with cool jazz chords. Brushed drums keep time. Saxophone weaves in. Contemplative and world-weary but smooth.", duration_ms: 10000 },
        { type: "chorus", description: "Full jazz ensemble swells slightly. More urgency in the bass line. Trumpet becomes assertive. The mood stays cool but the stakes rise.", duration_ms: 8000 },
        { type: "outro", description: "Instruments drop away one by one. Back to solo piano. One final bass note. Quiet.", duration_ms: 6000 },
      ]
    },
    force_instrumental: true,
  })

  await generateAndSave('noir-lofi', {
    prompt: 'Lo-fi noir jazz. Vinyl crackle, muted piano, distant saxophone, slow brushed drums. Cozy and dark. Late night detective energy. Background music for connecting conspiracy threads on a cork board. No vocals.',
    music_length_ms: 30000,
    force_instrumental: true,
  })

  await generateAndSave('noir-dramatic', {
    prompt: 'Jazz noir with rising drama. Starts intimate with solo piano. Double bass adds weight. Brass section enters mid-way with building intensity. Drums shift from brushes to sticks. Feels like uncovering a massive cover-up. Ends with a lone saxophone. No vocals.',
    music_length_ms: 30000,
    force_instrumental: true,
  })

  console.log('\n=== Done. Play files in public/cache/test/ ===\n')
}

main().catch(console.error)
