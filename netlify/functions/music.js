// netlify/functions/music.js
// Generates custom noir jazz music via ElevenLabs
// Returns raw mp3 binary

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  try {
    const { musicPrompt } = await req.json()
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY

    if (!ELEVENLABS_KEY || !musicPrompt) {
      return new Response('Missing key or prompt', { status: 400 })
    }

    console.log(`Music gen: "${musicPrompt.substring(0, 60)}..."`)

    const prompt = [
      'Late night noir jazz. Smoky bar.',
      'Muted trumpet, upright bass walking, brush drums, warm piano.',
      musicPrompt,
      'Relaxed but melancholic. No vocals. Film noir jazz. Loopable.',
    ].join(' ')

    let res = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, music_length_ms: 180000, force_instrumental: true }),
    })

    // Content filter retry
    if (!res.ok) {
      const errText = await res.text()
      try {
        const errData = JSON.parse(errText)
        if (errData?.detail?.data?.prompt_suggestion) {
          console.log('  Content filter, retrying...')
          res = await fetch('https://api.elevenlabs.io/v1/music', {
            method: 'POST',
            headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: errData.detail.data.prompt_suggestion, music_length_ms: 180000, force_instrumental: true }),
          })
        }
      } catch (e) { /* skip */ }

      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Music generation failed' }), {
          status: 502, headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const audio = await res.arrayBuffer()
    console.log(`  Music done (${(audio.byteLength / 1024).toFixed(0)} KB)`)

    return new Response(audio, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })

  } catch (err) {
    console.error('Music crash:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
