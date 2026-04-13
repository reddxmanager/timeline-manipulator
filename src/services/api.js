// src/services/api.js
// Frontend client for Symphony of Consequence backend

const API_BASE = '' // same origin, Netlify Functions

/**
 * Analyze a trigger event — returns ripple chain + musical parameters
 */
export async function analyzeEvent(eventText) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventText }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Analysis failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Generate orchestral music for the symphony
 * Returns an audio Blob
 */
export async function generateMusic(prompt, durationSeconds = 30) {
  const res = await fetch(`${API_BASE}/api/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'music',
      params: { prompt, duration_seconds: durationSeconds },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Music generation failed: ${res.status}`)
  }

  return res.blob()
}

/**
 * Generate a sound effect for a ripple domino hit
 * Returns an audio Blob
 */
export async function generateSFX(description, durationSeconds = 3) {
  const res = await fetch(`${API_BASE}/api/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'sfx',
      params: { text: description, duration_seconds: durationSeconds },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `SFX generation failed: ${res.status}`)
  }

  return res.blob()
}

/**
 * Generate narration for the ripple chain
 * Returns an audio Blob
 */
export async function generateNarration(text, voiceId = null) {
  const params = { text }
  if (voiceId) params.voice_id = voiceId

  const res = await fetch(`${API_BASE}/api/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'narration', params }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Narration failed: ${res.status}`)
  }

  return res.blob()
}

/**
 * Build the full music prompt from Claude's analysis
 */
export function buildMusicPrompt(analysis) {
  const { symphony_arc, ripples, title } = analysis
  const maxSeverity = Math.max(...ripples.map(r => r.severity))
  const domains = [...new Set(ripples.map(r => r.domain))]

  // Gather all instrument mentions
  const instruments = [...new Set(
    ripples
      .filter(r => r.musical?.instruments)
      .map(r => r.musical.instruments)
  )].join(', ')

  const prompt = [
    `Orchestral composition inspired by "${title}".`,
    symphony_arc?.opening ? `Opens with: ${symphony_arc.opening}.` : '',
    `Features: ${instruments || 'strings, brass, percussion'}.`,
    symphony_arc?.development ? `Develops: ${symphony_arc.development}.` : '',
    symphony_arc?.climax ? `Climax: ${symphony_arc.climax}.` : '',
    maxSeverity >= 4 ? 'Dramatic, intense, building to a powerful crescendo.' : '',
    maxSeverity <= 2 ? 'Contemplative, measured, with subtle tension.' : '',
    'Classical orchestral style. No vocals.',
  ].filter(Boolean).join(' ')

  return prompt
}

/**
 * Build SFX descriptions for each ripple based on domain
 */
export function buildSFXPrompts(ripples) {
  const domainSFX = {
    commodities: 'Deep industrial rumble, heavy machinery, oil drilling',
    finance: 'Stock ticker rapid clicking, market bell, coins cascading',
    logistics: 'Ship horn blast, container crane, waves crashing against hull',
    energy: 'Electrical surge, power grid humming, transformer buzzing',
    agriculture: 'Wind through wheat field, tractor engine, rain on crops',
    consumer: 'Cash register ding, shopping cart, grocery store ambience',
    personal: 'Phone notification, delivery doorbell, wallet opening',
    markets: 'Trading floor chaos, phones ringing, paper shuffling',
    regulation: 'Gavel strike, heavy door closing, stamp on paper',
    employment: 'Office phones ringing then going silent, desk clearing',
    'real estate': 'Keys jingling, door lock, moving truck backing up',
    media: 'Camera shutters, broadcast countdown, notification cascade',
    advertising: 'TV channel switching, radio static, billboard creaking',
    manufacturing: 'Assembly line stopping, metal stamping, conveyor belt',
    geopolitics: 'Military drums, radio static, diplomatic murmuring',
    culture: 'Crowd roaring, social media notification flood, trending sound',
    technology: 'Server room humming, keyboard typing, digital glitch',
  }

  return ripples.map(ripple => ({
    id: ripple.id,
    prompt: domainSFX[ripple.domain] || 'Impact sound, dramatic hit',
  }))
}

/**
 * Utility: create an audio URL from a Blob
 */
export function blobToAudioUrl(blob) {
  return URL.createObjectURL(blob)
}

/**
 * Utility: clean up audio URLs to prevent memory leaks
 */
export function revokeAudioUrl(url) {
  URL.revokeObjectURL(url)
}
