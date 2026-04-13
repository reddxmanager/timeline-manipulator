import { useState, useCallback, useEffect, useRef } from 'react'
import { EventCarousel } from './components/EventCarousel'
import { CorkBoard } from './components/CorkBoard'
import { AudioBar } from './components/AudioBar'
import { CassettePlayer } from './components/CassettePlayer'
import { CustomInput } from './components/CustomInput'
import { BranchChoice } from './components/BranchChoice'

// === SYNTHESIZED UI SOUNDS (Web Audio API, no files needed) ===
function playFolderSlap() {
  try {
    const ctx = new AudioContext()
    // Paper slap: short noise burst
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 8) * 0.4
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    // Low-pass filter for thud
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    src.connect(filter).connect(gain).connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 500)
  } catch {}
}

function playGlitchSound() {
  try {
    const ctx = new AudioContext()
    // Digital glitch: noise bursts with gaps
    const duration = 0.6
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate
      // Stutter pattern: on/off every 30-60ms
      const chunk = Math.floor(t * 25)
      const on = (chunk * 7 + 3) % 4 !== 0
      // Bitcrush effect
      const raw = Math.random() * 2 - 1
      const crushed = Math.round(raw * 4) / 4
      data[i] = on ? crushed * 0.25 * Math.pow(1 - t / duration, 2) : 0
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = 0.4
    src.connect(gain).connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 1000)
  } catch {}
}

// Cycling zalgo number that changes every 2.5 seconds
const ZALGO_NUMBERS = [
  '8\u0336\u03379\u0336\u03375\u0336\u03374\u0336\u03378\u0336\u03373\u0336\u03377\u0336\u0337',
  '4\u0336\u03372\u0336\u03370\u0336\u03371\u0336\u03376\u0336\u03379\u0336\u03372\u0336\u0337',
  '1\u0336\u03373\u0336\u03377\u0336\u03370\u0336\u03374\u0336\u03372\u0336\u03378\u0336\u0337',
  '6\u0336\u03379\u0336\u03371\u0336\u03375\u0336\u03373\u0336\u03370\u0336\u03374\u0336\u0337',
  '3\u0336\u03375\u0336\u03378\u0336\u03372\u0336\u03376\u0336\u03371\u0336\u03379\u0336\u0337',
  '7\u0336\u03370\u0336\u03374\u0336\u03379\u0336\u03371\u0336\u03378\u0336\u03375\u0336\u0337',
  '9\u0336\u03376\u0336\u03372\u0336\u03378\u0336\u03370\u0336\u03375\u0336\u03373\u0336\u0337',
  '2\u0336\u03378\u0336\u03370\u0336\u03376\u0336\u03375\u0336\u03374\u0336\u03371\u0336\u0337',
]
function CyclingNumber() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % ZALGO_NUMBERS.length), 2500)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontWeight: 700 }}>{ZALGO_NUMBERS[idx]}</span>
}

// --- Pose selection based on severity ---
function getPose(severity, isFirst, isLast) {
  if (isFirst) return 'Question'
  if (isLast) return 'shocked'
  if (severity >= 5) return 'shocked'
  if (severity >= 4) return 'Plotting'
  if (severity >= 3) return 'informative'
  if (severity >= 2) return 'cig'
  return 'shrugging'
}

// --- CAROUSEL PREVIEW DATA ---
// These are just for the carousel cards. The actual playing data
// comes from analysis.json loaded from cache.
const TIMELINE_EVENTS = [
  { id: 'hormuz', title: '2026 Strait of Hormuz Crisis', subtitle: 'Iran chokes 20% of global oil after US-Israeli strikes', category: 'geopolitics', severity: 5, tag: 'historical', rippleCount: 9 },
  { id: 'svb', title: 'Silicon Valley Bank Collapses', subtitle: "Tech's favorite bank goes to zero in 48 hours", category: 'finance', severity: 4, tag: 'historical', rippleCount: 6 },
  { id: 'suez-real', title: 'Ever Given Blocks the Suez Canal', subtitle: '6 days that choked global trade', category: 'logistics', severity: 4, tag: 'historical', rippleCount: 5 },
  { id: 'gamestop', title: 'GameStop Short Squeeze', subtitle: 'Reddit vs Wall Street', category: 'finance', severity: 3, tag: 'historical', rippleCount: 5 },
  { id: 'covid', title: 'COVID-19 Lockdowns Begin', subtitle: 'The world hits pause', category: 'geopolitics', severity: 5, tag: 'historical', rippleCount: 8 },
  { id: 'chatgpt', title: 'ChatGPT Changes Everything', subtitle: 'AI goes mainstream overnight', category: 'technology', severity: 4, tag: 'historical', rippleCount: 6 },
  { id: 'tariffs', title: 'Trump Tariff Escalation', subtitle: 'Trade war shakes global markets', category: 'geopolitics', severity: 4, tag: 'historical', rippleCount: 7 },
  { id: 'deepwater', title: 'Deepwater Horizon Explodes', subtitle: '87 days of oil into the Gulf', category: 'geopolitics', severity: 4, tag: 'historical', rippleCount: 6 },
  { id: 'fukushima', title: 'Fukushima Nuclear Disaster', subtitle: 'The meltdown that killed nuclear energy', category: 'geopolitics', severity: 5, tag: 'historical', rippleCount: 7 },
  { id: 'opec', title: '1973 OPEC Oil Embargo', subtitle: 'The original oil weapon', category: 'geopolitics', severity: 5, tag: 'historical', rippleCount: 6 },
]

const PARALLEL_EVENTS = [
  { id: 'mrbeast', title: 'MrBeast Signs $500M Amazon Deal', subtitle: 'Largest creator deal in history', category: 'media', severity: 3, tag: 'speculative', rippleCount: 5 },
  { id: 'tyson', title: 'Tyson KOs Jake Paul in Round 1', subtitle: 'The internet loses its mind', category: 'culture', severity: 2, tag: 'speculative', rippleCount: 4 },
  { id: 'suez', title: 'Suez Canal Blocked Again', subtitle: 'History repeats itself', category: 'logistics', severity: 4, tag: 'speculative', rippleCount: 5 },
  { id: 'tiktok-ban', title: 'TikTok Permanently Banned', subtitle: '170 million users displaced overnight', category: 'technology', severity: 4, tag: 'speculative', rippleCount: 6 },
  { id: 'bitcoin-1m', title: 'Bitcoin Hits $1 Million', subtitle: 'Digital gold goes supernova', category: 'finance', severity: 4, tag: 'speculative', rippleCount: 6 },
  { id: 'yellowstone', title: 'Yellowstone Supervolcano Erupts', subtitle: 'The big one finally blows', category: 'geopolitics', severity: 5, tag: 'speculative', rippleCount: 8 },
  { id: 'internet-down', title: 'Global Internet Goes Dark', subtitle: '72 hours without connectivity', category: 'technology', severity: 5, tag: 'speculative', rippleCount: 7 },
  { id: 'amazon-union', title: 'Amazon Workers Unionize', subtitle: 'The warehouse revolution', category: 'finance', severity: 3, tag: 'speculative', rippleCount: 5 },
  { id: 'swift-retires', title: 'Taylor Swift Retires From Touring', subtitle: 'The Eras Tour was the last era', category: 'culture', severity: 2, tag: 'speculative', rippleCount: 5 },
  { id: 'agi', title: 'OpenAI Open-Sources AGI', subtitle: 'Superhuman AI for everyone', category: 'technology', severity: 5, tag: 'speculative', rippleCount: 8 },
]

// --- Playback timing ---
const PRE_NARRATION_DELAY = 800
const POST_NARRATION_DELAY = 1200

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState(null) // full event data from analysis.json
  const [selectedPreview, setSelectedPreview] = useState(null) // carousel preview data
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeRipple, setActiveRipple] = useState(-1)
  const [view, setView] = useState('home') // 'home' | 'playing'
  const [showReddx, setShowReddx] = useState(false)
  const [reddxPose, setReddxPose] = useState('informative')
  const [loadError, setLoadError] = useState(null)
  const [showChoices, setShowChoices] = useState(false)
  const [isBranching, setIsBranching] = useState(false)
  const [branchData, setBranchData] = useState(null)
  const [timelineGlitch, setTimelineGlitch] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [transitioningId, setTransitioningId] = useState(null)
  const [showOverlay, setShowOverlay] = useState(false)

  // Audio refs
  const musicRef = useRef(null)
  const narrationRefs = useRef([])
  const sfxRefs = useRef([])
  const playbackRef = useRef([])
  const ambientRef = useRef(null)
  const [ambientStarted, setAmbientStarted] = useState(false)
  const selectedEventRef = useRef(null)
  selectedEventRef.current = selectedEvent

  const stopAll = useCallback(() => {
    playbackRef.current.forEach(id => clearTimeout(id))
    playbackRef.current = []
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.currentTime = 0; musicRef.current.volume = 0.15 }
    narrationRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    sfxRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    narrationRefs.current = []
    sfxRefs.current = []
    setShowReddx(false)
    setIsPlaying(false)
    setActiveRipple(-1)
    setShowChoices(false)
    setIsBranching(false)
    setBranchData(null)
    setTimelineGlitch(false)
  }, [])

  // Load analysis.json from cache when event is selected
  const handleSelectEvent = useCallback(async (preview) => {
    stopAll()
    setSelectedPreview(preview)
    setLoadError(null)
    setIntroComplete(false)

    // Start carousel exit transition (wiggle + pin drop + fade)
    setTransitioningId(preview.id)

    // Pin drop SFX
    try {
      const pinSfx = new Audio('/sfx/pin-drop.mp3')
      pinSfx.volume = 0.35
      pinSfx.play().catch(() => {})
    } catch (e) { /* no sfx file yet */ }

    const transitionStart = Date.now()
    const MIN_TRANSITION_MS = 2200 // enough time for wiggle + fade

    try {
      const res = await fetch(`/cache/${preview.id}/analysis.json`)
      if (!res.ok) throw new Error(`No cached data for ${preview.id}`)
      const analysis = await res.json()

      // Use analysis data as the event — this is what matches the narration audio
      const fullEvent = {
        ...preview,
        title: analysis.title || preview.title,
        subtitle: analysis.subtitle || preview.subtitle,
        severity: analysis.severity || preview.severity,
        tag: analysis.tag || preview.tag,
        category: analysis.category || preview.category,
        ripples: analysis.ripples || [],
        choices: analysis.choices || [],
      }

      setSelectedEvent(fullEvent)

      // Preload audio while transition plays
      musicRef.current = new Audio(`/cache/${preview.id}/music.mp3`)
      musicRef.current.volume = 0.15
      musicRef.current.loop = true

      narrationRefs.current = fullEvent.ripples.map((_, i) => {
        const audio = new Audio(`/cache/${preview.id}/narration-${i + 1}.mp3`)
        audio.volume = 0.9
        return audio
      })

      sfxRefs.current = fullEvent.ripples.map((_, i) => {
        const audio = new Audio(`/cache/${preview.id}/sfx-${i + 1}.mp3`)
        audio.volume = 0.35
        return audio
      })

      // Crossfade: overlay fades in, view switches behind it, overlay fades out
      const elapsed = Date.now() - transitionStart
      const overlayDelay = Math.max(0, 1200 - elapsed)

      setTimeout(() => setShowOverlay(true), overlayDelay)

      const switchDelay = Math.max(0, MIN_TRANSITION_MS - elapsed)
      setTimeout(() => {
        setTransitioningId(null)
        setView('playing')
        setTimeout(() => playFolderSlap(), 200) // folder lands on desk
        setTimeout(() => setShowOverlay(false), 100)
      }, switchDelay)
    } catch (err) {
      console.error('Failed to load event data:', err)
      setLoadError(`No cached data for "${preview.title}". Run: npm run cache:${preview.id}`)
      setTransitioningId(null)
      setView('home')
    }
  }, [stopAll])

  // CorkBoard signals intro animation is done
  const handlePlayRef = useRef(null)
  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
    // Autoplay: start the presentation when folder opens
    setTimeout(() => handlePlayRef.current?.(), 500)
  }, [])

  // Schedule next ripple — just sets activeRipple, CorkBoard's onCameraArrive handles the rest
  const scheduleNextRipple = useCallback((index) => {
    const event = selectedEventRef.current
    if (!event || index >= event.ripples.length) {
      // Chain done
      const endId = setTimeout(() => {
        setShowReddx(false)
        setIsPlaying(false)
        if (event?.choices?.length > 0 && !branchData) {
          if (musicRef.current) musicRef.current.volume = 0.12
          setShowChoices(true)
        } else {
          const fadeId = setInterval(() => {
            if (musicRef.current && musicRef.current.volume > 0.02) {
              musicRef.current.volume = Math.max(0, musicRef.current.volume - 0.02)
            } else { clearInterval(fadeId); if (musicRef.current) musicRef.current.pause() }
          }, 100)
        }
      }, 3000)
      playbackRef.current.push(endId)
      return
    }

    if (musicRef.current) musicRef.current.volume = 0.25
    setActiveRipple(index) // CorkBoard animates camera, calls onCameraArrive when done
  }, [branchData])

  // CorkBoard calls this when camera arrives at a node
  const handleCameraArrive = useCallback((nodeIndex) => {
    const event = selectedEventRef.current
    if (!event) return
    const ripple = event.ripples[nodeIndex]
    if (!ripple) return
    const isFirst = nodeIndex === 0
    const isLast = nodeIndex === event.ripples.length - 1

    if (musicRef.current) musicRef.current.volume = 0.2

    // SFX
    const sfxId = setTimeout(() => {
      if (sfxRefs.current[nodeIndex]) {
        sfxRefs.current[nodeIndex].currentTime = 0
        sfxRefs.current[nodeIndex].play().catch(() => {})
      }
    }, 300)
    playbackRef.current.push(sfxId)

    // ReddX + narration
    const narrateId = setTimeout(() => {
      setReddxPose(getPose(ripple.severity, isFirst, isLast))
      setShowReddx(true)
      if (musicRef.current) musicRef.current.volume = 0.08

      const narAudio = narrationRefs.current[nodeIndex]
      if (narAudio) {
        narAudio.currentTime = 0
        narAudio.play().catch(() => {})
        narAudio.onended = () => {
          if (musicRef.current) musicRef.current.volume = 0.2
          const hideId = setTimeout(() => setShowReddx(false), 400)
          playbackRef.current.push(hideId)
          const nextId = setTimeout(() => scheduleNextRipple(nodeIndex + 1), POST_NARRATION_DELAY)
          playbackRef.current.push(nextId)
        }
      } else {
        const skipId = setTimeout(() => { setShowReddx(false); scheduleNextRipple(nodeIndex + 1) }, 3000)
        playbackRef.current.push(skipId)
      }
    }, PRE_NARRATION_DELAY)
    playbackRef.current.push(narrateId)
  }, [scheduleNextRipple])

  const handlePlay = useCallback(() => {
    if (!selectedEvent) return

    // Hard reset everything first
    playbackRef.current.forEach(id => clearTimeout(id))
    playbackRef.current = []
    narrationRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    sfxRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    setShowReddx(false)
    setShowChoices(false)
    setActiveRipple(-1)

    setIsPlaying(true)

    // Start music
    if (musicRef.current) {
      if (ambientRef.current) {
        const amb = ambientRef.current
        const fadeOut = setInterval(() => {
          if (amb.volume > 0.005) { amb.volume = Math.max(0, amb.volume - 0.005) }
          else { clearInterval(fadeOut); amb.pause() }
        }, 50)
      }
      musicRef.current.currentTime = 0
      musicRef.current.volume = 0.15
      musicRef.current.play().catch(() => {})
    }

    // Kick off the first ripple
    const startId = setTimeout(() => scheduleNextRipple(0), 500)
    playbackRef.current.push(startId)
  }, [selectedEvent, scheduleNextRipple])
  handlePlayRef.current = handlePlay

  // Manual navigation
  const handleStop = useCallback(() => {
    playbackRef.current.forEach(id => clearTimeout(id))
    playbackRef.current = []
    narrationRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    sfxRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0 } })
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.currentTime = 0 }
    setShowReddx(false)
    setIsPlaying(false)
  }, [])

  const handleRewind = useCallback(() => {
    if (!selectedEvent) return
    handleStop()
    setActiveRipple(prev => Math.max(0, prev - 1))
  }, [selectedEvent, handleStop])

  const handleForward = useCallback(() => {
    if (!selectedEvent) return
    handleStop()
    setActiveRipple(prev => Math.min(selectedEvent.ripples.length - 1, prev + 1))
  }, [selectedEvent, handleStop])

  // Handle user's branch choice
  const handleBranch = useCallback(async (choice) => {
    setIsBranching(true)

    try {
      // Call branch API
      const res = await fetch('/api/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: selectedEvent.title,
          eventSummary: selectedEvent.subtitle,
          ripples: selectedEvent.ripples,
          userChoice: choice,
        })
      })

      if (!res.ok) throw new Error(`Branch failed: ${res.status}`)
      const branch = await res.json()
      setBranchData(branch)

      // Generate TTS for each narration
      const branchAudios = []
      for (const narText of (branch.narrations || [])) {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: narText })
          })
          if (ttsRes.ok) {
            const blob = await ttsRes.blob()
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.volume = 0.9
            branchAudios.push(audio)
          }
        } catch (err) { console.error('Branch TTS error:', err) }
      }

      // Append branch ripples to the event
      const branchRipples = (branch.ripples || []).map((r, i) => ({
        ...r,
        id: `branch-${i + 1}`,
        isBranch: true,
      }))

      // Append branch ripples after glitch (handled in setTimeout below)

      // Load branch narrations into narrationRefs
      narrationRefs.current = [...narrationRefs.current, ...branchAudios]

      // TIMELINE SHIFT — glitch effect + change to speculative
      setShowChoices(false)
      setIsBranching(false)
      setTimelineGlitch(true)
      playGlitchSound()

      // After glitch, update event and play branch
      setTimeout(() => {
        setTimelineGlitch(false)

        setSelectedEvent(prev => ({
          ...prev,
          tag: 'speculative',
          ripples: [...prev.ripples, ...branchRipples],
        }))

        setIsPlaying(true)
        if (musicRef.current) musicRef.current.volume = 0.2

        const baseIndex = selectedEvent.ripples.length
        const startId = setTimeout(() => scheduleNextRipple(baseIndex), 500)
        playbackRef.current.push(startId)
      }, 2000) // glitch lasts 2 seconds

    } catch (err) {
      console.error('Branch error:', err)
      setIsBranching(false)
      // Don't hide choices — let user try again or pick another
      setLoadError('Timeline branch collapsed. Pick a different path.')
    }
  }, [selectedEvent])

  // Custom event — live analysis + TTS + music
  const [customLoading, setCustomLoading] = useState(null) // loading progress text
  const [loadingTick, setLoadingTick] = useState(0)

  const LOADING_MESSAGES = [
    'Querying Turbopuffer for parallels...',
    'Cross-referencing historical data...',
    'Claude is tracing the conspiracy...',
    'Pulling classified documents...',
    'Checking the burrito index...',
    'Consulting Dark Gubbins...',
    'Scanning shipping manifests...',
    'Following the money trail...',
    'Intercepting communications...',
    'Destabilizing the timeline...',
    'Bribing a source...',
    'Decrypting field reports...',
    'Triangulating supply chains...',
    'Asking Brian...',
    'Hot dog man has entered the chat...',
    'Running entropy calculations...',
    'Checking alternate dimensions...',
    'Niblett is on the case...',
    'Compiling dossier...',
    'Generating noir jazz...',
    'Recording narration...',
    'ReddX is warming up the mic...',
    'Pinning evidence to corkboard...',
    'Connecting the red strings...',
    'Filing under CLASSIFIED...',
    'Checking the beagle network...',
    'Verifying with Zambales office...',
    'Calculating ripple effects...',
    'Assembling the case file...',
    'Almost there, detective...',
  ]

  useEffect(() => {
    if (!customLoading) return
    const id = setInterval(() => setLoadingTick(t => t + 1), 1200)
    return () => clearInterval(id)
  }, [customLoading])

  const handleCustomEvent = useCallback(async (eventText) => {
    stopAll()
    setView('playing')
    setIntroComplete(true)
    setLoadError(null)
    setCustomLoading(true)
    setLoadingTick(0)

    const loadingEvent = {
      id: 'custom', title: 'Analyzing...', subtitle: eventText,
      category: 'geopolitics', severity: 3, tag: 'speculative',
      ripples: [], choices: [],
    }
    setSelectedEvent(loadingEvent)

    try {
      // Call analyze API (includes Turbopuffer dedup + Claude + music generation)
      setCustomLoading(true)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventText }),
      })
      if (!res.ok) throw new Error(`Analyze failed: ${res.status}`)
      const analysis = await res.json()

      // Content rejected?
      if (analysis.rejected) {
        alert(analysis.reason || 'Nice try.')
        setView('home')
        setSelectedEvent(null)
        setCustomLoading(null)
        return
      }

      // Fire music + TTS in parallel

      const musicPromise = fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicPrompt: analysis.music_prompt || analysis.symphony_arc?.opening || 'noir jazz smoky bar' }),
      }).then(async r => {
        if (r.ok) {
          const blob = await r.blob()
          return new Audio(URL.createObjectURL(blob))
        }
        return null
      }).catch(() => null)

      // TTS for each narration
      const ttsPromises = (analysis.narrations || []).map(async (narText, i) => {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: narText }),
          })
          if (ttsRes.ok) {
            const blob = await ttsRes.blob()
            const audio = new Audio(URL.createObjectURL(blob))
            audio.volume = 0.9
            return audio
          }
        } catch {}
        return null
      })

      // Wait for both music and all TTS
      const [musicAudio, ...audioRefs] = await Promise.all([musicPromise, ...ttsPromises])

      // Set up music
      if (musicAudio) {
        musicRef.current = musicAudio
      } else {
        musicRef.current = new Audio('/cache/ambient-loop.mp3')
      }
      musicRef.current.volume = 0.15
      musicRef.current.loop = true

      // Set up the full event
      const fullEvent = {
        id: 'custom',
        title: analysis.title || eventText,
        subtitle: analysis.subtitle || '',
        category: analysis.category || 'geopolitics',
        severity: analysis.severity || 3,
        tag: analysis._cached ? 'speculative' : 'speculative',
        ripples: analysis.ripples || [],
        choices: analysis.choices || [],
      }

      setSelectedEvent(fullEvent)
      narrationRefs.current = audioRefs
      sfxRefs.current = fullEvent.ripples.map(() => null)
      setCustomLoading(null)

      // Autoplay after a beat
      setTimeout(() => handlePlayRef.current?.(), 800)

    } catch (err) {
      console.error('Custom event error:', err)
      setView('home')
      setSelectedEvent(null)
      setCustomLoading(null)
      setLoadError('Timeline unstable. ReddX Industries could not trace that event. Try another.')
    }
  }, [stopAll])

  const handleBack = useCallback(() => {
    stopAll()
    setView('home')
    setSelectedEvent(null)
    setSelectedPreview(null)
    setLoadError(null)
    setIntroComplete(false)
    setTransitioningId(null)
    setShowOverlay(false)
    setCustomLoading(null)
    // Restart ambient
    if (ambientRef.current) {
      ambientRef.current.volume = 0
      ambientRef.current.play().catch(() => {})
      const fadeIn = setInterval(() => {
        if (ambientRef.current.volume < 0.045) { ambientRef.current.volume = Math.min(0.05, ambientRef.current.volume + 0.005) }
        else { clearInterval(fadeIn) }
      }, 50)
    }
  }, [stopAll])

  // Start ambient jazz on first user interaction
  useEffect(() => {
    const startAmbient = () => {
      if (ambientRef.current || ambientStarted) return
      const audio = new Audio('/cache/ambient-loop.mp3')
      audio.volume = 0.05
      audio.loop = true
      audio.play().catch(() => {})
      ambientRef.current = audio
      setAmbientStarted(true)
    }
    document.addEventListener('click', startAmbient, { once: true })
    return () => document.removeEventListener('click', startAmbient)
  }, [ambientStarted])

  useEffect(() => { return () => { stopAll(); if (ambientRef.current) ambientRef.current.pause() } }, [stopAll])

  return (
    <div style={styles.app}>
      {/* CSS smoke — always visible, zero video decode */}
      <div className="smoke-css" />
      {view === 'home' && (
        <>
          <div className="lamp-glow-pulse" />
          <div className="coffee-stain" style={{ top: 60, right: 80, transform: 'rotate(15deg)' }} />
        </>
      )}
      <div style={styles.frameTop} />
      <div style={styles.frameBottom} />

      {view === 'home' && (
        <>
          {/* Hero — fades out during transition */}
          <div style={{
            ...styles.centered,
            opacity: transitioningId ? 0 : 1,
            transition: 'opacity 0.8s ease 0.3s',
          }}>
            <header style={styles.hero}>
              <p className="hero-eyebrow" style={styles.eyebrow}>
                REDDX INDUSTRIES &mdash; PRODUCT DEMO
              </p>
              <h1 className="hero-title" style={styles.title}>Timeline Manipulator</h1>
              <div style={styles.underline} />
              <p className="hero-subtitle" style={styles.subtitle}>
                ReddX Industries has been proudly destabilizing<br />causality for over <CyclingNumber /> years.
              </p>
            </header>
          </div>

          {loadError && (
            <div style={styles.centered}>
              <div style={styles.errorBox}>{loadError}</div>
            </div>
          )}

          <section style={{
            ...styles.carouselSection,
            opacity: transitioningId && !TIMELINE_EVENTS.some(e => e.id === transitioningId) ? 0 : 1,
            transition: 'opacity 0.8s ease 0.3s',
          }}>
            <div className="section-enter" style={{
              ...styles.centered,
              marginBottom: 16,
              opacity: transitioningId ? 0 : 1,
              transition: 'opacity 0.6s ease 0.2s',
            }}>
              <h2 style={styles.sectionTitle}><span style={styles.pinnedIcon}>&#128204;</span> Current Timeline</h2>
              <p style={styles.sectionSub}>confirmed events &mdash; verified consequences</p>
            </div>
            <div className="carousel-enter">
              <EventCarousel events={TIMELINE_EVENTS} onSelect={handleSelectEvent} transitioningId={transitioningId} autoPlayDelay={0} />
            </div>
          </section>

          <section style={{
            ...styles.carouselSection,
            opacity: transitioningId && !PARALLEL_EVENTS.some(e => e.id === transitioningId) ? 0 : 1,
            transition: 'opacity 0.8s ease 0.3s',
          }}>
            <div className="section-enter-2" style={{
              ...styles.centered,
              marginBottom: 16,
              opacity: transitioningId ? 0 : 1,
              transition: 'opacity 0.6s ease 0.2s',
            }}>
              <h2 style={{ ...styles.sectionTitle, color: '#cc9922' }}>
                <span style={styles.pinnedIcon}>&#9888;&#65039;</span> Parallel Timeline
              </h2>
              <p style={styles.sectionSub}>projected events &mdash; what happens when...</p>
            </div>
            <div className="carousel-enter-2">
              <EventCarousel events={PARALLEL_EVENTS} onSelect={handleSelectEvent} transitioningId={transitioningId} autoPlayDelay={3500} />
            </div>
          </section>

          <div className="input-enter" style={{
            ...styles.centered,
            opacity: transitioningId ? 0 : 1,
            transition: 'opacity 0.6s ease 0.2s',
          }}>
            <section style={styles.inputSection}>
              <CustomInput onSubmit={handleCustomEvent} />
            </section>
          </div>
        </>
      )}

      {view === 'playing' && selectedEvent && (
        <>
          {/* CorkBoard handles its own intro → ready animation */}
          <CorkBoard
            event={selectedEvent}
            activeRipple={activeRipple}
            isPlaying={isPlaying}
            reddxPose={reddxPose}
            showReddx={showReddx}
            onIntroComplete={handleIntroComplete}
            onCameraArrive={handleCameraArrive}
          />

          {/* Custom event loading overlay */}
          {customLoading && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(30,20,12,0.92)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20,
            }}>
              <div style={{
                fontFamily: 'var(--font-handwriting)', fontSize: 36, fontWeight: 700,
                color: '#f0ebe0', textShadow: '2px 2px 6px rgba(0,0,0,0.4)',
              }}>
                Opening case file...
              </div>
              <div style={{
                fontFamily: 'var(--font-typewriter)', fontSize: 13,
                color: '#c8b89a', letterSpacing: '0.05em',
              }}>
                {LOADING_MESSAGES[loadingTick % LOADING_MESSAGES.length]}
              </div>
              <div style={{
                width: 200, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
              }}>
                <div style={{
                  width: '60%', height: '100%', borderRadius: 2,
                  background: 'var(--string-red)',
                  animation: 'loading-slide 2s ease-in-out infinite',
                }} />
              </div>
              <style>{`
                @keyframes loading-slide {
                  0% { transform: translateX(-100%); }
                  50% { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
              `}</style>
            </div>
          )}

          {/* Overlay UI — compact top bar */}
          <div style={{
            ...styles.overlayUI,
            opacity: introComplete ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <div style={styles.topBar}>
              <button onClick={handleBack} style={styles.backButton}>
                <span style={styles.backArrow}>&larr;</span> back
              </button>
              <div style={styles.topBarCenter}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                  <span style={{ ...styles.tagBadge, background: selectedEvent.tag === 'historical' ? '#44884a' : '#cc9922' }}>
                    {selectedEvent.tag === 'historical' ? '\u2713 CONFIRMED' : '\u26A0 PROJECTED'}
                  </span>
                  <span style={{ ...styles.tagBadge, background: '#222' }}>
                    {selectedEvent.category.toUpperCase()}
                  </span>
                </div>
                <h1 style={styles.eventTitle}>{selectedEvent.title}</h1>
              </div>
              <div style={{ width: 70 }} />{/* spacer to center title */}
            </div>
          </div>

          {/* Audio bar */}
          <div style={{
            opacity: introComplete ? 1 : 0,
            transition: 'opacity 0.6s ease 0.2s',
          }}>
            <CassettePlayer
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onStop={handleStop}
              onRewind={handleRewind}
              onForward={handleForward}
              rippleCount={selectedEvent.ripples.length}
              activeRipple={activeRipple}
              severity={selectedEvent.severity}
              eventTitle={selectedEvent.title}
            />
          </div>

          {/* Branch choice — fixed above cassette player */}
          {showChoices && selectedEvent.choices && (
            <div style={{ position: 'fixed', bottom: 190, left: 0, right: 0, zIndex: 75 }}>
              <BranchChoice
                choices={selectedEvent.choices}
                onChoose={handleBranch}
                isGenerating={isBranching}
                branchResult={branchData}
              />
            </div>
          )}
        </>
      )}

      {/* Crossfade overlay to mask view switch */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none',
        background: '#3a2a18',
        opacity: showOverlay ? 1 : 0,
        transition: showOverlay ? 'opacity 0.8s ease' : 'opacity 0.5s ease',
      }} />

      {/* Timeline shift glitch */}
      {timelineGlitch && (
        <div className="timeline-glitch" style={{
          position: 'fixed', inset: 0, zIndex: 998, pointerEvents: 'none',
        }}>
          <div className="glitch-text">TIMELINE SHIFT</div>
          <div className="glitch-tear" style={{ animationDelay: '0s' }} />
          <div className="glitch-tear" style={{ animationDelay: '0.07s', top: '30%' }} />
          <div className="glitch-tear" style={{ animationDelay: '0.13s', top: '60%' }} />
          <div className="glitch-tear" style={{ animationDelay: '0.04s', top: '80%' }} />
        </div>
      )}

      <footer style={styles.footer}>
        <img src="/reddx_logo.png" alt="ReddX" style={{ height: 20, width: 'auto', opacity: 0.6 }} />
        <span style={styles.footerText}>REDDX INDUSTRIES</span>
        <span style={styles.footerDot}>&bull;</span>
        <span style={styles.footerText}>CLASSIFIED</span>
      </footer>
    </div>
  )
}

const styles = {
  app: { position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  lampGlow: { position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(255,220,150,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 },
  frameTop: { position: 'fixed', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to bottom, #3a2a18, transparent)', zIndex: 200, pointerEvents: 'none' },
  frameBottom: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to top, #3a2a18, transparent)', zIndex: 200, pointerEvents: 'none' },
  centered: { position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%' },
  hero: { textAlign: 'center', paddingTop: 32, paddingBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  eyebrow: { fontFamily: 'var(--font-typewriter)', fontSize: 12, letterSpacing: '0.12em', color: '#c8b89a', marginBottom: 16, textTransform: 'uppercase' },
  title: { fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(52px, 9vw, 110px)', fontWeight: 700, lineHeight: 1.3, color: '#f0ebe0', marginBottom: 10, padding: '0 8px 16px 8px', textShadow: '2px 2px 6px rgba(0,0,0,0.4)', overflow: 'visible' },
  underline: { width: 200, height: 3, background: 'var(--string-red)', marginBottom: 18, borderRadius: 2, boxShadow: '0 0 10px var(--string-glow)' },
  subtitle: { fontFamily: 'var(--font-typewriter)', fontSize: 14, lineHeight: 1.8, color: '#b8a88a', maxWidth: 460 },
  carouselSection: { position: 'relative', zIndex: 1, marginBottom: 16 },
  sectionTitle: { fontFamily: 'var(--font-handwriting)', fontSize: 32, fontWeight: 600, color: '#e8dcc8', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, textShadow: '1px 1px 4px rgba(0,0,0,0.3)' },
  pinnedIcon: { fontSize: 20 },
  sectionSub: { fontFamily: 'var(--font-typewriter)', fontSize: 12, color: '#a09078', fontStyle: 'italic' },
  inputSection: { maxWidth: 600, margin: '0 auto', paddingBottom: 100 },
  errorBox: { fontFamily: 'var(--font-typewriter)', fontSize: 13, color: '#cc3333', background: 'rgba(204,48,48,0.1)', padding: '12px 20px', borderRadius: 4, marginBottom: 16, textAlign: 'center', border: '1px solid rgba(204,48,48,0.2)' },
  // Overlay UI sits on top of the corkboard
  overlayUI: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'linear-gradient(to bottom, rgba(30,20,12,0.85) 0%, rgba(30,20,12,0.4) 70%, transparent 100%)',
    pointerEvents: 'auto',
  },
  topBarCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  backButton: {
    background: 'rgba(30,20,12,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#ddd',
    fontFamily: 'var(--font-typewriter)',
    fontSize: 12,
    cursor: 'pointer',
    padding: '6px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'auto',
    transition: 'background 0.2s',
  },
  backArrow: { fontSize: 16 },
  eventHeader: {
    textAlign: 'center',
    padding: '12px 24px 0',
  },
  tagBadge: { display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 3, color: '#fff' },
  eventTitle: { fontFamily: 'var(--font-handwriting)', fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 700, lineHeight: 1.2, color: '#f0ebe0', marginBottom: 2, textShadow: '2px 2px 8px rgba(0,0,0,0.5)', overflow: 'visible' },
  eventSubtitle: { fontFamily: 'var(--font-typewriter)', fontSize: 11, color: '#999', fontStyle: 'italic' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 14, background: 'linear-gradient(transparent, rgba(74, 50, 32, 0.9) 40%)', zIndex: 150, pointerEvents: 'none' },
  footerText: { fontFamily: 'var(--font-typewriter)', fontSize: 10, color: '#999', letterSpacing: '0.15em' },
  footerDot: { color: '#999', fontSize: 10 },
}
