// src/hooks/useSymphony.js
// Manages the full audio experience: music + SFX + narration in sync with cascade

import { useState, useRef, useCallback, useEffect } from 'react'
import { blobToAudioUrl, revokeAudioUrl } from '../services/api'

const RIPPLE_INTERVAL_MS = 3000 // time between ripple reveals — tune to music

export function useSymphony() {
  const [state, setState] = useState({
    phase: 'idle',       // idle | loading | playing | complete
    activeRipple: -1,
    loadingMessage: '',
  })

  const musicRef = useRef(null)       // HTMLAudioElement for the symphony
  const narrationRef = useRef(null)   // HTMLAudioElement for narration
  const sfxRefs = useRef([])          // HTMLAudioElement[] for each ripple SFX
  const timerRef = useRef(null)
  const urlsRef = useRef([])          // track blob URLs for cleanup

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      urlsRef.current.forEach(revokeAudioUrl)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  /**
   * Load audio assets for a given event analysis
   * audioAssets: { musicBlob?, narrationBlob?, sfxBlobs?: Blob[] }
   */
  const loadAudio = useCallback((audioAssets) => {
    // Clean up previous
    urlsRef.current.forEach(revokeAudioUrl)
    urlsRef.current = []
    sfxRefs.current = []

    if (audioAssets.musicBlob) {
      const url = blobToAudioUrl(audioAssets.musicBlob)
      urlsRef.current.push(url)
      musicRef.current = new Audio(url)
      musicRef.current.volume = 0.6
    }

    if (audioAssets.narrationBlob) {
      const url = blobToAudioUrl(audioAssets.narrationBlob)
      urlsRef.current.push(url)
      narrationRef.current = new Audio(url)
      narrationRef.current.volume = 0.9
    }

    if (audioAssets.sfxBlobs) {
      sfxRefs.current = audioAssets.sfxBlobs.map(blob => {
        const url = blobToAudioUrl(blob)
        urlsRef.current.push(url)
        const audio = new Audio(url)
        audio.volume = 0.4
        return audio
      })
    }
  }, [])

  /**
   * Play the full symphony experience
   * rippleCount: number of ripples to cascade through
   */
  const play = useCallback((rippleCount) => {
    if (state.phase === 'playing') return

    setState(s => ({ ...s, phase: 'playing', activeRipple: -1 }))

    // Start music
    if (musicRef.current) {
      musicRef.current.currentTime = 0
      musicRef.current.play().catch(console.warn)
    }

    // Start narration slightly after music
    if (narrationRef.current) {
      setTimeout(() => {
        narrationRef.current.currentTime = 0
        narrationRef.current.play().catch(console.warn)
      }, 1500)
    }

    // Cascade ripples on interval
    let currentRipple = 0
    const revealNext = () => {
      if (currentRipple >= rippleCount) {
        clearInterval(timerRef.current)
        // Let music finish, then mark complete
        setTimeout(() => {
          setState(s => ({ ...s, phase: 'complete' }))
        }, 3000)
        return
      }

      setState(s => ({ ...s, activeRipple: currentRipple }))

      // Play SFX for this ripple
      if (sfxRefs.current[currentRipple]) {
        sfxRefs.current[currentRipple].currentTime = 0
        sfxRefs.current[currentRipple].play().catch(console.warn)
      }

      currentRipple++
    }

    // First ripple immediately
    revealNext()

    // Then cascade
    timerRef.current = setInterval(revealNext, RIPPLE_INTERVAL_MS)
  }, [state.phase])

  /**
   * Stop everything
   */
  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (musicRef.current) {
      musicRef.current.pause()
      musicRef.current.currentTime = 0
    }
    if (narrationRef.current) {
      narrationRef.current.pause()
      narrationRef.current.currentTime = 0
    }
    sfxRefs.current.forEach(a => {
      a.pause()
      a.currentTime = 0
    })
    setState({ phase: 'idle', activeRipple: -1, loadingMessage: '' })
  }, [])

  /**
   * Update loading state
   */
  const setLoading = useCallback((message) => {
    setState(s => ({ ...s, phase: 'loading', loadingMessage: message }))
  }, [])

  return {
    ...state,
    loadAudio,
    play,
    stop,
    setLoading,
  }
}
