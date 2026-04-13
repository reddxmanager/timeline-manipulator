// netlify/functions/generate-audio.js
// Generates music, SFX, or narration via ElevenLabs APIs

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { type, params } = await req.json()
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set')

    let audioBuffer

    switch (type) {
      case 'music':
        audioBuffer = await generateMusic(apiKey, params)
        break
      case 'sfx':
        audioBuffer = await generateSFX(apiKey, params)
        break
      case 'narration':
        audioBuffer = await generateNarration(apiKey, params)
        break
      default:
        return Response.json({ error: 'Invalid type. Use: music, sfx, narration' }, { status: 400 })
    }

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      }
    })
  } catch (err) {
    console.error('Audio generation error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

async function generateMusic(apiKey, params) {
  const { prompt, music_length_ms = 30000 } = params

  const response = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      music_length_ms,
      force_instrumental: true,
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs Music: ${response.status} - ${err}`)
  }

  return await response.arrayBuffer()
}

async function generateSFX(apiKey, params) {
  const { text, duration_seconds } = params

  const body = { text }
  if (duration_seconds) body.duration_seconds = duration_seconds

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs SFX: ${response.status} - ${err}`)
  }

  return await response.arrayBuffer()
}

async function generateNarration(apiKey, params) {
  const {
    text,
    voice_id = process.env.REDDX_VOICE_ID || process.env.GUBBINS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    model_id = 'eleven_multilingual_v2'
  } = params

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true,
      }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs TTS: ${response.status} - ${err}`)
  }

  return await response.arrayBuffer()
}

export const config = {
  path: '/api/generate-audio'
}
