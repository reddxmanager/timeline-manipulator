// src/services/cache.js
// Manages cached audio for pre-generated carousel events
// Cached assets live in /public/cache/{eventId}/
// Structure:
//   /public/cache/hormuz/music.mp3
//   /public/cache/hormuz/narration.mp3
//   /public/cache/hormuz/sfx-1.mp3
//   /public/cache/hormuz/sfx-2.mp3
//   /public/cache/hormuz/analysis.json

/**
 * Check if an event has cached audio assets
 */
export async function hasCachedAudio(eventId) {
  try {
    const res = await fetch(`/cache/${eventId}/analysis.json`, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Load cached analysis (ripple chain + musical params) for a carousel event
 */
export async function loadCachedAnalysis(eventId) {
  const res = await fetch(`/cache/${eventId}/analysis.json`)
  if (!res.ok) return null
  return res.json()
}

/**
 * Load all cached audio assets for an event
 * Returns { musicBlob, narrationBlob, sfxBlobs[] }
 */
export async function loadCachedAudio(eventId) {
  const assets = { musicBlob: null, narrationBlob: null, sfxBlobs: [] }

  // Music
  try {
    const musicRes = await fetch(`/cache/${eventId}/music.mp3`)
    if (musicRes.ok) assets.musicBlob = await musicRes.blob()
  } catch { /* no cached music */ }

  // Narration
  try {
    const narRes = await fetch(`/cache/${eventId}/narration.mp3`)
    if (narRes.ok) assets.narrationBlob = await narRes.blob()
  } catch { /* no cached narration */ }

  // SFX — try loading up to 10
  for (let i = 1; i <= 10; i++) {
    try {
      const sfxRes = await fetch(`/cache/${eventId}/sfx-${i}.mp3`)
      if (sfxRes.ok) {
        assets.sfxBlobs.push(await sfxRes.blob())
      } else {
        break // no more SFX files
      }
    } catch {
      break
    }
  }

  return assets
}

/**
 * Save generated audio to local storage as base64 for session persistence
 * (For custom events that get generated live)
 */
export function saveToSession(eventId, audioAssets) {
  // We won't use localStorage in production artifacts
  // This is just for dev — in prod, cache goes to /public/cache/
  console.log(`Would cache ${eventId} to session — skipping in dev`)
}
