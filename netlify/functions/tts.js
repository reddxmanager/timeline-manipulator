// netlify/functions/tts.js
// Live TTS — takes narration text, returns mp3 audio via ElevenLabs

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 })
  }

  const { text } = await req.json()
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 })
  }

  const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.REDDX_VOICE_ID || process.env.GUBBINS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.6, use_speaker_boost: true }
    })
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: `TTS: ${res.status}`, detail: err }), { status: 502 })
  }

  const audio = await res.arrayBuffer()

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
