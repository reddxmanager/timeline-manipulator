// scripts/generate-ambient.js
// Generates a short ambient jazz loop for the home screen
// Run: node --env-file=.env.local scripts/generate-ambient.js

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
if (!ELEVENLABS_KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1) }

async function main() {
  const outDir = join(__dirname, '..', 'public', 'cache')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  console.log('\n=== Generating ambient home screen loop ===\n')

  const prompt = [
    'Very quiet, minimal noir jazz.',
    'Solo upright bass with gentle brush on snare.',
    'Occasional soft piano note, widely spaced.',
    'Extremely sparse. More silence than sound.',
    'Smoky empty bar at 2am, last call was an hour ago.',
    'Background atmosphere, not a performance.',
    'No melody. Just texture and warmth.',
    'No vocals. Loopable.',
  ].join(' ')

  console.log(`  Prompt: "${prompt.substring(0, 80)}..."`)
  console.log('  Generating 30 seconds...')

  const res = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      music_length_ms: 30000,
      force_instrumental: true,
    })
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`  Failed: ${res.status} - ${err}`)
    process.exit(1)
  }

  const buf = await res.arrayBuffer()
  writeFileSync(join(outDir, 'ambient-loop.mp3'), Buffer.from(buf))
  console.log(`  Saved: public/cache/ambient-loop.mp3 (${(buf.byteLength / 1024).toFixed(0)} KB)`)
  console.log('\n=== Done ===\n')
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
