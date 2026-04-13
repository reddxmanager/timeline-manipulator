import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

// === PRNG ===
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// === CONSTANTS ===
const SEVERITY_COLORS = { 1: '#44884a', 2: '#88a444', 3: '#cc9922', 4: '#cc6622', 5: '#cc3333' }
const PIN_COLORS = ['#cc3333', '#3366aa', '#44884a', '#cc9922', '#3366aa', '#cc3333', '#44884a', '#cc9922']

const DOMAIN_LABELS = {
  commodities: 'COMMODITIES', finance: 'FINANCE', logistics: 'LOGISTICS',
  energy: 'ENERGY', agriculture: 'AGRICULTURE', consumer: 'CONSUMER',
  personal: 'PERSONAL', markets: 'MARKETS', regulation: 'REGULATION',
  employment: 'EMPLOYMENT', 'real estate': 'REAL ESTATE', media: 'MEDIA',
  advertising: 'ADVERTISING', manufacturing: 'MANUFACTURING',
  geopolitics: 'GEOPOLITICS', culture: 'CULTURE', technology: 'TECHNOLOGY',
}

function cardRot(i) {
  const rots = [-3, 2.5, -1.5, 3, -2, 1.8, -2.8, 1.2, -1, 2.2]
  return rots[i % rots.length]
}

const NODE_SPACING = 1200
const NODE_WIDTH = 340
const BOARD_PADDING = 600
const BOARD_HEIGHT = 3000

const FOLDER_W = 400
const FOLDER_H = 500
const FOLDER_X = -450
const FOLDER_Y = (BOARD_HEIGHT - FOLDER_H) / 2

const INTRO_ZOOM = 0.5
const PRE_ZOOM_PHASES = ['start', 'zoomed-out', 'shaking', 'folder-open']
const TRAVEL_DURATION = 3500

// === PATH MATH ===
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function catmullRomToSVG(points) {
  if (points.length < 2) return ''
  const pts = [points[0], ...points, points[points.length - 1]]
  let d = `M ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// === LAYOUT GENERATORS ===
function generateNodePositions(count, rng) {
  return Array.from({ length: count }, (_, i) => {
    const x = BOARD_PADDING + i * NODE_SPACING
    const y = 400 + rng() * 1800
    return { x, y, cx: x + NODE_WIDTH / 2, cy: y + 140, pinX: x + NODE_WIDTH / 2, pinY: y - 8 }
  })
}

function generateStringPaths(positions, rng) {
  const paths = []
  for (let i = 1; i < positions.length; i++) {
    const start = positions[i - 1], end = positions[i]
    const dx = end.pinX - start.pinX, dy = end.pinY - start.pinY
    // 2-3 sharp zig-zag turns between nodes
    const numTurns = 2 + Math.floor(rng() * 2)
    const waypoints = [{ x: start.pinX, y: start.pinY }]
    const pins = [] // pushpin positions at turns

    for (let t = 0; t < numTurns; t++) {
      const frac = (t + 1) / (numTurns + 1)
      const baseX = start.pinX + dx * frac
      const baseY = start.pinY + dy * frac
      const dir = (t % 2 === 0) ? -1 : 1
      const offsetY = dir * (150 + rng() * 300)
      const offsetX = (rng() - 0.5) * 100
      const pt = {
        x: Math.max(100, baseX + offsetX),
        y: Math.max(150, Math.min(BOARD_HEIGHT - 150, baseY + offsetY)),
      }
      waypoints.push(pt)
      pins.push(pt)
    }

    waypoints.push({ x: end.pinX, y: end.pinY })

    // Build SVG path as straight line segments (zig-zag, not curves)
    let d = `M ${waypoints[0].x.toFixed(1)} ${waypoints[0].y.toFixed(1)}`
    for (let w = 1; w < waypoints.length; w++) {
      d += ` L ${waypoints[w].x.toFixed(1)} ${waypoints[w].y.toFixed(1)}`
    }

    paths.push({ d, waypoints, pins })
  }
  return paths
}

// === CLUTTER GENERATOR ===
const STICKY_TEXTS = [
  'WHO BENEFITS?', 'FOLLOW THE MONEY', 'COINCIDENCE?', '???', 'CHECK THIS', 'NOPE',
  'LOOK CLOSER', 'CONNECT THE DOTS', 'WHY THO', 'SUS', 'NOT A DRILL', 'WAKE UP',
  'BIG IF TRUE', 'THEY KNEW', 'TIMING???', 'HOT DOG MAN', 'ASK BRIAN',
  '@DaytonDoes', 'GUBBINS WAS HERE', 'CALL MOM', 'NEED COFFEE', 'BURRITO FUND',
  'WHO LET HIM COOK', 'TRUST NO ONE', 'EXCEPT BRIAN', 'REDDX WAS RIGHT',
  'NOT AGAIN', 'UNRELATED??', 'SAME ENERGY', 'DELETE LATER', 'TODO: SLEEP',
  'DARK GUBBINS SAYS HI', 'ENTROPY WINS', 'ALWAYS HAS BEEN', 'THE BEAGLES KNOW',
  'NIBLETT DID THIS', 'SIDEWAYS HEART', 'COST OF BEANS', 'WAIT WHAT', 'NO WAY',
  'I CALLED IT', 'PAGE 47', 'BERMUDA?', 'MOON PHASE?', 'VIBES OFF',
  'TRUST THE PROCESS', 'FRIDGE NOTE', 'BUY MILK', 'NOT MY PROBLEM', 'YET',
  'TELL NOBODY', 'RACHEL KNOWS', 'HATCHBYTE?', 'SPIN IT', 'FIDGE IT',
]
const STICKY_COLORS = ['#f5e6a0', '#a0d4f5', '#f5c0a0', '#c0f5a0', '#f5a0a0', '#f5f5a0']
const POLAROID_LABELS = [
  'Market Data', 'Oil Sample', 'Intercepted', 'Site Photo', 'Field Report',
  'Follow the Money', 'Shipping Log', 'Supply Chain', 'Lab Analysis', 'Wiretap Log',
  'Marked Map', 'Surveillance', 'News Clipping', 'Key Evidence', 'Sample B-7', 'Bank Records',
]
const PHOTO_DOMAINS = [
  'energy', 'finance', 'logistics', 'consumer', 'personal', 'markets',
  'agriculture', 'technology', 'employment', 'regulation', 'media',
  'geopolitics', 'culture', 'manufacturing', 'commodities', 'real estate',
]
const SCRAP_TEXTS = [
  'CLASSIFIED', 'REDACTED', 'SEE PAGE 4', 'TOP SECRET', 'EYES ONLY', 'CONFIDENTIAL',
  'NEED TO KNOW', 'BURN AFTER READING', 'DO NOT COPY', 'INTERNAL USE ONLY',
  'DRAFT v47', 'REJECTED', 'PENDING REVIEW', 'LOST IN TRANSIT', 'MISFILED',
  'REDDX INDUSTRIES', 'PROPERTY OF RXI', 'FILE 7734', 'DEPT OF ENTROPY',
  'TIMELINE BRANCH 4', 'CAUSALITY VIOLATION', 'REF: HOT DOG MAN', 'ASK GUBBINS',
  'NOT FOR DISTRIBUTION', 'HANDLE WITH CARE', 'FRAGILE TIMELINE', 'VOID IF OPENED',
  'COFFEE STAINED', 'ORIGINAL COPY', 'DUPLICATE ORIGINAL', 'FILED WRONG',
  'MISSING PAGE 3', 'SEE ATTACHMENT', 'NO ATTACHMENT', 'ERROR 404',
  'DAYTONDOES.COM', 'TIMESTAMP INVALID', 'OVERWRITTEN', 'BACKUP COPY',
  'BRIAN SIGNED THIS', 'APPROVED BY NIBLETT', 'RACHEL FILED THIS',
  'FOUND IN BREAKROOM', 'UNDER THE FRIDGE', 'STUCK TO BURRITO',
  'ZAMBALES OFFICE', 'MANILA BRANCH', 'SENT FROM MY PHONE',
  'PRIORITY: LOW', 'PRIORITY: YES', 'URGENT: NOT REALLY',
]
const HEADLINE_TEXTS = [
  'MARKETS REACT', 'EXPERTS BAFFLED', 'CRISIS DEEPENS', 'BREAKING NEWS',
  'DEVELOPING STORY', 'SOURCES SAY', 'REPORT: EVERYTHING FINE', 'OPINION: NO',
  'STUDY FINDS LINK', 'INSIDER TIPS', 'LEAKED DOCUMENTS', 'WHISTLEBLOWER',
  'CONGRESS SHRUGS', 'CEO STEPS DOWN', 'STOCK PLUMMETS', 'RALLY CONTINUES',
  'ECONOMISTS DISAGREE', 'SUPPLY CHAIN CHAOS', 'CONSUMERS PANIC',
  'REDDX INDUSTRIES DENIES', 'TIMELINE ANOMALY DETECTED', 'LOCAL MAN CONFUSED',
  'BURRITO PRICES SURGE', 'HOT DOG SHORTAGE LOOMS', 'BEAGLES REACT',
]

function generatePathClutter(paths, rng, occupied) {
  const items = []

  const overlaps = (x, y, w, h) => {
    for (const box of occupied) {
      if (x < box.x + box.w && x + w > box.x && y < box.y + box.h && y + h > box.y) return true
    }
    return false
  }

  paths.forEach((path, pi) => {
    const n = 10 + Math.floor(rng() * 8)
    for (let i = 0; i < n; i++) {
      const t = (i + 0.3 + rng() * 0.4) / n
      const wi = Math.min(Math.floor(t * (path.waypoints.length - 1)), path.waypoints.length - 2)
      const lt = (t * (path.waypoints.length - 1)) - wi
      const w1 = path.waypoints[wi], w2 = path.waypoints[wi + 1]
      const bx = w1.x + (w2.x - w1.x) * lt, by = w1.y + (w2.y - w1.y) * lt

      // Try up to 3 positions to avoid overlap
      let x, y, placed = false
      for (let attempt = 0; attempt < 3; attempt++) {
        const od = 80 + rng() * 200 + attempt * 80, oa = rng() * Math.PI * 2
        x = bx + Math.cos(oa) * od
        y = by + Math.sin(oa) * od
        if (!overlaps(x, y, 140, 120)) { placed = true; break }
      }
      if (!placed) { rng(); rng(); continue } // burn RNG to keep determinism

      const rot = (rng() - 0.5) * 20
      const r = rng()

      if (r < 0.14) items.push({ type: 'polaroid', x, y, rot, afterNode: pi, id: Math.floor(x * 7 + y) % 999 })
      else if (r < 0.28) items.push({ type: 'newspaper', x, y, rot, afterNode: pi, text: HEADLINE_TEXTS[Math.floor(rng() * HEADLINE_TEXTS.length)] })
      else if (r < 0.48) items.push({ type: 'sticky', x, y, rot, afterNode: pi, text: STICKY_TEXTS[Math.floor(rng() * STICKY_TEXTS.length)], color: STICKY_COLORS[Math.floor(rng() * STICKY_COLORS.length)] })
      else if (r < 0.58) items.push({ type: 'coffee', x, y, size: 30 + rng() * 50, afterNode: pi })
      else if (r < 0.68) items.push({ type: 'tape', x, y, rot: (rng() - 0.5) * 40, afterNode: pi })
      else if (r < 0.78) items.push({ type: 'scrap', x, y, rot, afterNode: pi, text: SCRAP_TEXTS[Math.floor(rng() * SCRAP_TEXTS.length)] })
      else if (r < 0.86) items.push({ type: 'map', x, y, rot, afterNode: pi, refNum: Math.floor(rng() * 9000 + 1000) })
      else if (r < 0.93) items.push({ type: 'mugshot', x, y, rot, afterNode: pi })
      else items.push({ type: 'redCircle', x, y, size: 40 + rng() * 50, afterNode: pi })
      occupied.push({ x, y, w: 150, h: 130 })
    }
  })
  return items
}

// Evidence pinned at string turn points — larger, more prominent
const PIN_EVIDENCE_LABELS = [
  'EXHIBIT A', 'EXHIBIT B', 'SUBJECT ALPHA', 'REF: TIMELINE', 'CROSS-REF',
  'SOURCE FILE', 'FIELD PHOTO', 'INTERCEPT #7', 'DOCUMENT 14-B', 'SPECIMEN',
  'DISPATCH', 'MEMO', 'TRANSCRIPT', 'SIGNAL LOG', 'WITNESS PHOTO',
]
function generatePinEvidence(paths, rng, occupied) {
  const items = []
  const overlaps = (x, y, w, h) => {
    for (const box of occupied) {
      if (x < box.x + box.w && x + w > box.x && y < box.y + box.h && y + h > box.y) return true
    }
    return false
  }
  paths.forEach((path, pi) => {
    (path.pins || []).forEach((pin, pinIdx) => {
      let px, py, placed = false
      for (let attempt = 0; attempt < 5; attempt++) {
        const offsetX = (rng() - 0.5) * (60 + attempt * 40)
        const offsetY = (rng() - 0.5) * (40 + attempt * 30) + 40
        px = pin.x + offsetX - 75
        py = pin.y + offsetY
        if (!overlaps(px, py, 190, 190)) { placed = true; break }
      }
      if (!placed) { rng(); rng(); return }
      const rot = (rng() - 0.5) * 12
      const r = rng()
      const id = Math.floor(pin.x * 11 + pin.y * 3 + pinIdx * 7) % 999
      if (r < 0.45) {
        items.push({ type: 'bigPolaroid', x: px, y: py, rot, afterNode: pi, id })
        occupied.push({ x: px, y: py, w: 160, h: 190 })
      } else if (r < 0.75) {
        items.push({ type: 'bigDocument', x: px, y: py, rot, afterNode: pi, text: HEADLINE_TEXTS[Math.floor(rng() * HEADLINE_TEXTS.length)], label: PIN_EVIDENCE_LABELS[Math.floor(rng() * PIN_EVIDENCE_LABELS.length)] })
        occupied.push({ x: px, y: py, w: 190, h: 150 })
      } else {
        items.push({ type: 'bigLetter', x: px, y: py, rot, afterNode: pi, text: STICKY_TEXTS[Math.floor(rng() * STICKY_TEXTS.length)] })
        occupied.push({ x: px, y: py, w: 140, h: 170 })
      }
    })
  })
  return items
}

// Extra scattered clutter across the full board
function generateBoardClutter(totalWidth, rng, occupied) {
  const items = []
  const overlaps = (x, y, w, h) => {
    for (const box of occupied) {
      if (x < box.x + box.w && x + w > box.x && y < box.y + box.h && y + h > box.y) return true
    }
    return false
  }
  const count = 15 + Math.floor(rng() * 10)
  for (let i = 0; i < count; i++) {
    let x, y, placed = false
    for (let attempt = 0; attempt < 4; attempt++) {
      x = 100 + rng() * (totalWidth - 200)
      y = 100 + rng() * (BOARD_HEIGHT - 200)
      if (!overlaps(x, y, 160, 140)) { placed = true; break }
    }
    if (!placed) { rng(); continue }
    const rot = (rng() - 0.5) * 25
    const r = rng()
    if (r < 0.2) items.push({ type: 'polaroid', x, y, rot, afterNode: -999, id: Math.floor(x * 3 + y * 7) % 999 })
    else if (r < 0.35) items.push({ type: 'sticky', x, y, rot, afterNode: -999, text: STICKY_TEXTS[Math.floor(rng() * STICKY_TEXTS.length)], color: STICKY_COLORS[Math.floor(rng() * STICKY_COLORS.length)] })
    else if (r < 0.5) items.push({ type: 'coffee', x, y, size: 30 + rng() * 60, afterNode: -999 })
    else if (r < 0.65) items.push({ type: 'scrap', x, y, rot, afterNode: -999, text: SCRAP_TEXTS[Math.floor(rng() * SCRAP_TEXTS.length)] })
    else if (r < 0.75) items.push({ type: 'tape', x, y, rot: (rng() - 0.5) * 40, afterNode: -999 })
    else if (r < 0.85) items.push({ type: 'newspaper', x, y, rot, afterNode: -999, text: HEADLINE_TEXTS[Math.floor(rng() * HEADLINE_TEXTS.length)] })
    else if (r < 0.92) items.push({ type: 'map', x, y, rot, afterNode: -999, refNum: Math.floor(rng() * 9000 + 1000) })
    else items.push({ type: 'redCircle', x, y, size: 40 + rng() * 60, afterNode: -999 })
    occupied.push({ x, y, w: 160, h: 140 })
  }
  return items
}

// === MAIN COMPONENT ===
const ANNOTATIONS = {
  last: [
    'ARE YOU KIDDING ME?!', 'THIS is the punchline.', 'I CANT EVEN.', 'seriously?!',
    'oh come ON.', 'you gotta be joking.', 'REALLY?!', 'im done.', 'unbelievable.',
    'THIS. THIS RIGHT HERE.', 'I need a drink.', 'kill me.', 'bruh.',
    'no. NO.', 'thats it. im out.', 'whyyyy', 'the AUDACITY.', 'wow. just wow.',
    'i hate it here.', 'PAIN.',
  ],
  high: [
    'THIS IS BAD !!', 'oh no no no', 'brace yourself.', 'yikes.',
    'RED ALERT', 'not good not good', 'uh oh.', 'buckle up.',
    'here it comes...', 'things are escalating.', 'DEFCON 2.', 'we have a problem.',
    'hold on to something.', 'mayday.', 'this is fine. (its not fine)', 'gulp.',
    'abandon ship?', 'houston...', 'told you so.', 'welp.',
  ],
  mid: [
    'watch this...', 'interesting.', 'see the pattern?', 'follow the money.',
    'connect the dots.', 'hmm suspicious.', 'look closer.', 'wait for it...',
    'and THEN...', 'it gets better.', 'oh it goes deeper.', 'classic.',
    'saw this coming.', 'nobody noticed.', 'keep watching.', 'the plot thickens.',
    'smell that?', 'right on schedule.', 'predictable.', 'and here we go.',
  ],
  low: [
    'and then...', 'huh.', 'barely a ripple.', 'minor detail.',
    'footnote material.', 'moving on...', 'sure why not.', 'ok.',
    'whatever.', 'neat I guess.', 'filed under: meh.', 'next.',
    'yawn.', 'noted.', 'thats a thing.', 'cool cool cool.',
    'anyway...', 'so that happened.', 'riveting.', 'small potatoes.',
  ],
}

function getAnnotation(severity, isLast, index) {
  const pool = isLast ? ANNOTATIONS.last
    : severity >= 4 ? ANNOTATIONS.high
    : severity >= 3 ? ANNOTATIONS.mid
    : ANNOTATIONS.low
  return pool[index % pool.length]
}

export function CorkBoard({ event, activeRipple, isPlaying, reddxPose, showReddx, onIntroComplete, onCameraArrive }) {
  const ripples = event?.ripples || []

  // ReddX blink
  const BLINK_POSES = ['informative', 'cig', 'Question', 'shrugging', 'Source', 'big brain time', 'base', 'Nodding', 'popcorn', 'Chuckle', 'Conan', 'Cringe', 'Devil', 'arms_crossed', 'amungus', 'angel', 'Raccoon_cosplay', 'Sailor_moon', 'Shotgun', 'sponge_bob_1', 'sponge_bob_2', 'sponge_reddx_3', 'Therapist', 'void']
  const [isBlinking, setIsBlinking] = useState(false)
  useEffect(() => {
    if (!showReddx) return
    const id = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, 2500 + Math.random() * 2000)
    return () => clearInterval(id)
  }, [showReddx, reddxPose])
  const hasBlink = BLINK_POSES.includes(reddxPose)
  const reddxSrc = (isBlinking && hasBlink) ? `/reddx/${reddxPose}-blink.png` : `/reddx/${reddxPose || 'informative'}.png`

  // Deterministic layout
  const layout = useMemo(() => {
    const positions = generateNodePositions(ripples.length, mulberry32(42))
    const paths = generateStringPaths(positions, mulberry32(137))
    const occupied = []
    const clutter = generatePathClutter(paths, mulberry32(293), occupied)
    const pinEvidence = generatePinEvidence(paths, mulberry32(555), occupied)
    const bgClutter = generateBoardClutter(BOARD_PADDING * 2 + Math.max(0, ripples.length - 1) * NODE_SPACING + NODE_WIDTH, mulberry32(777), occupied)
    return { positions, paths, clutter: [...clutter, ...pinEvidence, ...bgClutter] }
  }, [ripples.length])

  const totalWidth = BOARD_PADDING * 2 + Math.max(0, ripples.length - 1) * NODE_SPACING + NODE_WIDTH

  // Viewport
  const [vpW, setVpW] = useState(window.innerWidth)
  const [vpH, setVpH] = useState(window.innerHeight)
  const vpRef = useRef({ w: vpW, h: vpH })

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      vpRef.current = { w, h }; setVpW(w); setVpH(h)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Intro
  const [introPhase, setIntroPhase] = useState('start')
  const onIntroCompleteRef = useRef(onIntroComplete)
  onIntroCompleteRef.current = onIntroComplete
  const onCameraArriveRef = useRef(onCameraArrive)
  onCameraArriveRef.current = onCameraArrive

  useEffect(() => {
    const timers = [
      setTimeout(() => setIntroPhase('zoomed-out'), 50),
      setTimeout(() => setIntroPhase('shaking'), 200),
      setTimeout(() => setIntroPhase('folder-open'), 1300),
      setTimeout(() => setIntroPhase('zooming-in'), 2500),
      setTimeout(() => { setIntroPhase('ready'); onIntroCompleteRef.current?.() }, 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Camera
  const [boardTransform, setBoardTransform] = useState('')
  const [boardTransition, setBoardTransition] = useState('none')
  const [glowPos, setGlowPos] = useState(null)
  const cameraAnimRef = useRef(null)
  const pathRefs = useRef([])

  const isPreZoom = PRE_ZOOM_PHASES.includes(introPhase)
  const isIntro = introPhase !== 'ready'
  const folderCX = FOLDER_X + FOLDER_W / 2
  const folderCY = FOLDER_Y + FOLDER_H / 2
  const folderArriving = introPhase === 'shaking'
  const flapOpen = ['folder-open', 'zooming-in', 'ready'].includes(introPhase)
  const contentVisible = introPhase === 'zooming-in' || introPhase === 'ready'

  // Intro camera
  useEffect(() => {
    if (introPhase === 'ready') return
    let zoom, focalX, focalY
    if (isPreZoom) {
      zoom = INTRO_ZOOM; focalX = folderCX; focalY = folderCY
    } else {
      zoom = 1
      const pos = layout.positions[0]
      focalX = pos ? pos.cx : BOARD_PADDING + NODE_WIDTH / 2
      focalY = pos ? pos.cy : BOARD_HEIGHT / 2
    }
    const tx = vpW / 2 - focalX * zoom, ty = vpH / 2 - focalY * zoom
    setBoardTransform(`translate(${tx}px, ${ty}px) scale(${zoom})`)
    if (introPhase === 'start') setBoardTransition('none')
    else if (introPhase === 'zooming-in') setBoardTransition('transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)')
    else setBoardTransition('transform 0.3s ease-out')
  }, [introPhase, vpW, vpH, layout])

  // Playback camera — follow string paths
  useEffect(() => {
    if (introPhase !== 'ready' || activeRipple < 0) return
    if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current)

    const { w: vw, h: vh } = vpRef.current

    if (activeRipple === 0) {
      const pos = layout.positions[0]
      if (!pos) return
      setBoardTransform(`translate(${vw / 2 - pos.cx}px, ${vh / 2 - pos.cy}px) scale(1)`)
      setBoardTransition('transform 0.8s ease')
      setGlowPos({ x: pos.pinX, y: pos.pinY })
      const id = setTimeout(() => onCameraArriveRef.current?.(0), 1500)
      return () => clearTimeout(id)
    }

    // Follow path from previous node to current
    const pathEl = pathRefs.current[activeRipple - 1]
    if (!pathEl) {
      const pos = layout.positions[activeRipple]
      if (pos) {
        setBoardTransform(`translate(${vw / 2 - pos.cx}px, ${vh / 2 - pos.cy}px) scale(1)`)
        setBoardTransition('transform 2s ease')
      }
      const id = setTimeout(() => onCameraArriveRef.current?.(activeRipple), 2100)
      return () => clearTimeout(id)
    }

    setBoardTransition('none')
    const pathLength = pathEl.getTotalLength()
    const startTime = performance.now()

    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / TRAVEL_DURATION)
      const eased = easeInOutCubic(t)
      const point = pathEl.getPointAtLength(pathLength * eased)
      const cvw = vpRef.current.w, cvh = vpRef.current.h
      setBoardTransform(`translate(${cvw / 2 - point.x}px, ${cvh / 2 - point.y}px) scale(1)`)
      setGlowPos({ x: point.x, y: point.y })

      if (t < 1) {
        cameraAnimRef.current = requestAnimationFrame(animate)
      } else {
        const pos = layout.positions[activeRipple]
        if (pos) {
          setBoardTransform(`translate(${cvw / 2 - pos.cx}px, ${cvh / 2 - pos.cy}px) scale(1)`)
          setBoardTransition('transform 0.4s ease-out')
        }
        const id = setTimeout(() => onCameraArriveRef.current?.(activeRipple), 500)
        cameraAnimRef.current = null
        return () => clearTimeout(id)
      }
    }

    cameraAnimRef.current = requestAnimationFrame(animate)
    return () => { if (cameraAnimRef.current) cancelAnimationFrame(cameraAnimRef.current) }
  }, [activeRipple, introPhase, layout])

  // Manual drag/zoom navigation (when not playing)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, tx: 0, ty: 0, zoom: 1 })
  const manualMode = introPhase === 'ready' && !isPlaying

  const handleMouseDown = useCallback((e) => {
    if (!manualMode || e.button !== 0) return
    const d = dragRef.current
    // Parse current transform to get tx, ty
    const match = boardTransform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)/)
    if (match) { d.tx = parseFloat(match[1]); d.ty = parseFloat(match[2]) }
    d.dragging = true; d.startX = e.clientX; d.startY = e.clientY
    setBoardTransition('none')
  }, [manualMode, boardTransform])

  const handleMouseMove = useCallback((e) => {
    const d = dragRef.current
    if (!d.dragging) return
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY
    const z = d.zoom
    setBoardTransform(`translate(${d.tx + dx}px, ${d.ty + dy}px) scale(${z})`)
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  const handleWheel = useCallback((e) => {
    if (!manualMode) return
    e.preventDefault()
    const d = dragRef.current
    const match = boardTransform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)\s*scale\(([\d.-]+)\)/)
    let tx = 0, ty = 0, z = 1
    if (match) { tx = parseFloat(match[1]); ty = parseFloat(match[2]); z = parseFloat(match[3]) }
    const newZ = Math.max(0.3, Math.min(2, z - e.deltaY * 0.001))
    d.zoom = newZ; d.tx = tx; d.ty = ty
    setBoardTransition('none')
    setBoardTransform(`translate(${tx}px, ${ty}px) scale(${newZ})`)
  }, [manualMode, boardTransform])

  // Keyboard navigation
  useEffect(() => {
    if (!manualMode) return
    const PAN = 150
    const handleKey = (e) => {
      const match = boardTransform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)\s*scale\(([\d.-]+)\)/)
      let tx = 0, ty = 0, z = 1
      if (match) { tx = parseFloat(match[1]); ty = parseFloat(match[2]); z = parseFloat(match[3]) }
      let moved = false
      if (e.key === 'ArrowLeft' || e.key === 'a') { tx += PAN; moved = true }
      if (e.key === 'ArrowRight' || e.key === 'd') { tx -= PAN; moved = true }
      if (e.key === 'ArrowUp' || e.key === 'w') { ty += PAN; moved = true }
      if (e.key === 'ArrowDown' || e.key === 's') { ty -= PAN; moved = true }
      if (e.key === '=' || e.key === '+') { z = Math.min(2, z + 0.15); moved = true }
      if (e.key === '-') { z = Math.max(0.3, z - 0.15); moved = true }
      if (moved) {
        e.preventDefault()
        setBoardTransition('transform 0.2s ease-out')
        setBoardTransform(`translate(${tx}px, ${ty}px) scale(${z})`)
        dragRef.current.tx = tx; dragRef.current.ty = ty; dragRef.current.zoom = z
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [manualMode, boardTransform])

  return (
    <div
      style={{ ...styles.viewport, cursor: manualMode ? 'grab' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          ...styles.board,
          width: totalWidth,
          height: BOARD_HEIGHT,
          transform: boardTransform,
          transformOrigin: '0 0',
          transition: boardTransition,
        }}
      >
        {/* ─── FOLDER ─── */}
        <div style={{ position: 'absolute', left: FOLDER_X, top: FOLDER_Y, width: FOLDER_W, height: FOLDER_H, zIndex: 20, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: '#c9a960', padding: '6px 24px', borderRadius: '5px 5px 0 0', boxShadow: '0 -2px 8px rgba(0,0,0,0.12)', zIndex: 5 }}>
            <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: 10, letterSpacing: '0.15em', color: '#5a3e28', fontWeight: 700 }}>CASE FILE</span>
          </div>
          <div style={{ position: 'absolute', top: -50, right: -70, width: 75, height: 55, background: '#f5e6a0', transform: 'rotate(8deg)', borderRadius: 1, boxShadow: '2px 3px 6px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
            <span style={{ fontFamily: 'var(--font-handwriting)', fontSize: 13, fontWeight: 600, color: '#333' }}>START HERE</span>
          </div>
          <div style={{ position: 'absolute', bottom: -35, left: -50, width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(90,60,30,0.15)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', top: 80, left: -65, width: 80, height: 50, background: '#a0d4f5', transform: 'rotate(-6deg)', borderRadius: 1, boxShadow: '2px 3px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
            <span style={{ fontFamily: 'var(--font-handwriting)', fontSize: 11, fontWeight: 600, color: '#333' }}>DEEP STATE?</span>
          </div>

          <div className={folderArriving ? 'folder-arrive' : ''} style={{ width: '100%', height: '100%', position: 'relative', transform: 'rotate(-1.5deg)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, #d4b080 0%, #c4a46c 40%, #b89850 100%)', borderRadius: 4, boxShadow: '5px 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }} />
            <div style={{ position: 'absolute', inset: 4, background: 'linear-gradient(175deg, #ece2d0 0%, #ddd0b8 100%)', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, zIndex: 1 }}>
              <div style={{ position: 'absolute', top: 24, right: 18, fontFamily: 'var(--font-typewriter)', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', color: '#cc3333', border: '3px solid #cc3333', padding: '4px 14px', transform: 'rotate(14deg)', opacity: 0.5 }}>CLASSIFIED</div>
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', padding: '3px 10px', borderRadius: 2, background: event?.tag === 'historical' ? '#44884a' : '#cc9922' }}>{event?.tag === 'historical' ? 'CONFIRMED' : 'PROJECTED'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', padding: '3px 10px', borderRadius: 2, background: '#333' }}>{event?.category?.toUpperCase()}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-handwriting)', fontSize: 34, fontWeight: 700, color: '#2a1a0e', lineHeight: 1.15, marginBottom: 8, maxWidth: 320 }}>{event?.title}</h2>
                <p style={{ fontFamily: 'var(--font-typewriter)', fontSize: 12, color: '#5a3e28', fontStyle: 'italic' }}>"{event?.subtitle}"</p>
              </div>
              <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0 }}>
                <svg style={{ width: '75%', height: 55, display: 'block', margin: '0 auto' }} viewBox="0 0 300 55" preserveAspectRatio="xMidYMid meet">
                  <path d="M 15 28 C 50 8, 95 48, 150 22" stroke="#c23030" strokeWidth="2" fill="none" opacity="0.3" />
                  <path d="M 150 22 C 200 5, 240 42, 285 18" stroke="#c23030" strokeWidth="2" fill="none" opacity="0.3" />
                  <circle cx="15" cy="28" r="3" fill="#c23030" opacity="0.4" />
                  <circle cx="150" cy="22" r="3" fill="#c23030" opacity="0.4" />
                  <circle cx="285" cy="18" r="3" fill="#c23030" opacity="0.4" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 50, marginTop: -30, opacity: 0.18 }}>
                  {['-4deg', '2.5deg', '-1.5deg'].map((r, i) => (
                    <div key={i} style={{ width: 48, height: 32, background: '#e8dcc8', borderRadius: 1, transform: `rotate(${r})`, boxShadow: '1px 1px 3px rgba(0,0,0,0.15)' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
              background: 'linear-gradient(170deg, #d4b080 0%, #c4a46c 40%, #b89850 100%)',
              borderRadius: 4, transformOrigin: 'top center',
              transform: flapOpen ? 'perspective(800px) rotateX(-170deg)' : 'perspective(800px) rotateX(0deg)',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 2,
              backfaceVisibility: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(0,0,0,0.018) 22px, rgba(0,0,0,0.018) 23px)',
            }} />
          </div>
        </div>

        {/* ─── BOARD CONTENT ─── */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: BOARD_HEIGHT, opacity: contentVisible ? 1 : 0, transition: 'opacity 1.2s ease' }}>
          {/* String SVG */}
          <svg width={totalWidth} height={BOARD_HEIGHT} viewBox={`0 0 ${totalWidth} ${BOARD_HEIGHT}`} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 3 }}>
            <defs>
              <filter id="string-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-dot">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {layout.paths.map((path, i) => {
              const isRevealed = activeRipple > i
              const isCurrent = activeRipple === i + 1
              return (
                <path
                  key={`string-${i}`}
                  ref={el => { pathRefs.current[i] = el }}
                  d={path.d}
                  stroke={isRevealed || isCurrent ? '#c23030' : 'rgba(194,48,48,0.06)'}
                  strokeWidth={isRevealed || isCurrent ? 3 : 1.5}
                  fill="none"
                  filter={isRevealed || isCurrent ? 'url(#string-glow)' : 'none'}
                  className={isCurrent ? 'string-pulse' : ''}
                  style={{ transition: 'stroke 0.8s ease, stroke-width 0.8s ease' }}
                />
              )
            })}

            {/* Pushpins at string turn points */}
            {layout.paths.map((path, i) => {
              const isRevealed = activeRipple > i
              return (path.pins || []).map((pin, pi) => (
                <g key={`pin-${i}-${pi}`}>
                  <circle cx={pin.x} cy={pin.y} r={8} fill={isRevealed ? '#c23030' : '#8a4a4a'} stroke="rgba(255,255,255,0.2)" strokeWidth={1} style={{ transition: 'fill 0.8s ease' }} />
                  <circle cx={pin.x - 2} cy={pin.y - 2} r={2.5} fill="rgba(255,255,255,0.35)" />
                </g>
              ))
            })}

            {/* Glow dot traveling along string */}
            {glowPos && activeRipple >= 0 && (
              <circle cx={glowPos.x} cy={glowPos.y} r={10} fill="#c23030" filter="url(#glow-dot)" opacity={0.9} className="string-pulse" />
            )}
          </svg>

          {/* Clutter */}
          {layout.clutter.map((item, i) => (
            <ClutterItem key={`clutter-${i}`} item={item} revealed={item.afterNode < activeRipple} />
          ))}

          {/* Nodes */}
          {ripples.map((ripple, i) => {
            const pos = layout.positions[i]
            if (!pos) return null
            const isRevealed = i <= activeRipple
            const isCurrent = i === activeRipple
            const isLast = i === ripples.length - 1
            const color = SEVERITY_COLORS[ripple.severity]
            const pinColor = PIN_COLORS[i % PIN_COLORS.length]
            const rot = cardRot(i)

            return (
              <div key={ripple.id || `node-${i}`} style={{
                ...styles.nodeContainer,
                left: pos.x, top: pos.y,
                opacity: isRevealed ? 1 : 0.06,
                transform: `rotate(${rot}deg) scale(${isCurrent ? 1.08 : 1})`,
                transition: 'opacity 0.8s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: isCurrent ? 10 : 5,
              }}>
                <div style={{ ...styles.pushpin, background: pinColor }}><div style={styles.pinHighlight} /></div>
                <div style={{ ...styles.tape, top: -3, left: 15, transform: 'rotate(-7deg)' }} />
                <div style={{ ...styles.tape, top: -3, right: 15, transform: 'rotate(4deg)' }} />
                <div style={{
                  ...styles.card,
                  boxShadow: isCurrent ? '6px 8px 24px rgba(0,0,0,0.45), 0 0 40px rgba(194,48,48,0.1)' : '3px 4px 12px rgba(0,0,0,0.2)',
                  borderColor: isCurrent ? 'rgba(194,48,48,0.3)' : 'rgba(0,0,0,0.06)',
                }}>
                  <div style={styles.nodeNumber}>{i + 1}</div>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.domainStamp, color, borderColor: color }}>{DOMAIN_LABELS[ripple.domain] || ripple.domain?.toUpperCase()}</span>
                    <span style={styles.delay}>{ripple.delay}</span>
                  </div>
                  <p style={styles.headline}>{ripple.headline}</p>
                  {ripple.source && (
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(ripple.headline)}`} target="_blank" rel="noopener noreferrer" style={styles.sourceLink} onClick={e => e.stopPropagation()}>
                      <span style={styles.sourceIcon}>&#128206;</span>
                      <span style={styles.sourceName}>{ripple.source.title || ripple.source}</span>
                    </a>
                  )}
                  <div style={styles.severityBar}>
                    <div style={{ ...styles.severityFill, width: isRevealed ? `${ripple.severity * 20}%` : '0%', background: color }} />
                  </div>
                  {isCurrent && (
                    <div style={styles.annotation}>
                      {getAnnotation(ripple.severity, isLast, i)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spotlight */}
      <div style={{ ...styles.spotlight, opacity: !isIntro && isPlaying && activeRipple >= 0 ? 0.6 : (isPreZoom ? 0.25 : 0) }} />

      {/* ReddX */}
      <div style={{ ...styles.reddxContainer, transform: showReddx ? 'translateX(0)' : 'translateX(110%)', opacity: showReddx ? 1 : 0 }}>
        <img src={reddxSrc} alt="ReddX" style={styles.reddxImage} onError={e => { e.target.src = '/reddx/base.png' }} />
      </div>

      {/* Vignettes */}
      <div style={styles.vignetteLeft} />
      <div style={styles.vignetteRight} />
      <div style={styles.vignetteTop} />
      <div style={styles.vignetteBottom} />

      {/* Progress */}
      {!isIntro && isPlaying && activeRipple >= 0 && (
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((activeRipple + 1) / ripples.length) * 100}%` }} />
          <span style={styles.progressText}>{activeRipple + 1} / {ripples.length}</span>
        </div>
      )}
    </div>
  )
}

// === CLUTTER COMPONENTS ===
function ClutterItem({ item, revealed }) {
  const zHash = item.id != null ? item.id : Math.floor(item.x * 7.3 + item.y * 13.7)
  const base = { position: 'absolute', left: item.x, top: item.y, opacity: revealed ? 0.7 : 0.04, transition: 'opacity 1.2s ease', zIndex: 1 + Math.abs(zHash) % 8, pointerEvents: 'none' }

  switch (item.type) {
    case 'polaroid': {
      const domain = PHOTO_DOMAINS[item.id % PHOTO_DOMAINS.length]
      const label = POLAROID_LABELS[item.id % POLAROID_LABELS.length]
      return (
        <div style={{ ...base, width: 100, height: 120, background: '#fff', padding: 6, borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '3px 4px 10px rgba(0,0,0,0.2)' }}>
          <div style={{ width: '100%', height: 80, background: '#8a7a6a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <img
              src={`/photos/${domain}.jpg`}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', filter: 'sepia(0.3) contrast(1.1)' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: 9, color: '#c8b89a', fontWeight: 700, letterSpacing: '0.08em', textAlign: 'center', display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{label}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 10, color: '#333', textAlign: 'center', marginTop: 4 }}>Evidence #{item.id}</div>
        </div>
      )
    }
    case 'newspaper':
      return (
        <div style={{ ...base, width: 140, height: 80, background: '#d8d0c0', padding: '8px 10px', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '2px 3px 8px rgba(0,0,0,0.15)', borderBottom: '2px solid #333' }}>
          <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 4 }}>{item.text}</div>
          <div style={{ height: 5, background: '#999', marginBottom: 3, width: '90%', borderRadius: 1 }} />
          <div style={{ height: 5, background: '#aaa', marginBottom: 3, width: '75%', borderRadius: 1 }} />
          <div style={{ height: 5, background: '#bbb', width: '60%', borderRadius: 1 }} />
        </div>
      )
    case 'sticky':
      return (
        <div style={{ ...base, width: 80, height: 65, background: item.color, borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '2px 3px 6px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-handwriting)', fontSize: 13, fontWeight: 600, color: '#333', textAlign: 'center', padding: 6 }}>{item.text}</span>
        </div>
      )
    case 'coffee':
      return <div style={{ ...base, width: item.size, height: item.size, borderRadius: '50%', border: '3px solid rgba(90,60,30,0.15)' }} />
    case 'tape':
      return <div style={{ ...base, width: 60, height: 18, background: 'rgba(240,230,160,0.5)', borderRadius: 1, transform: `rotate(${item.rot}deg)` }} />
    case 'scrap':
      return (
        <div style={{ ...base, width: 90, height: 28, background: '#d8d0c0', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '1px 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: 8, letterSpacing: '0.1em', color: '#8a1a1a' }}>{item.text}</span>
        </div>
      )
    case 'map':
      return (
        <div style={{ ...base, width: 120, height: 90, background: '#e8dcc8', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '2px 3px 8px rgba(0,0,0,0.12)', backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '15px 15px' }}>
          <div style={{ position: 'absolute', top: 4, left: 6, fontFamily: 'var(--font-typewriter)', fontSize: 7, color: '#666', letterSpacing: '0.1em' }}>CLASSIFIED</div>
          <div style={{ position: 'absolute', bottom: 4, right: 6, fontFamily: 'var(--font-mono)', fontSize: 6, color: '#999' }}>REF: {item.refNum}</div>
        </div>
      )
    case 'mugshot':
      return (
        <div style={{ ...base, width: 80, height: 100, background: '#2a2420', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '2px 3px 8px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 50, borderRadius: '50% 50% 3px 3px', background: '#5a4a3a', marginBottom: 6 }} />
          <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: 6, color: '#cc3333', letterSpacing: '0.1em' }}>PERSON OF INTEREST</span>
        </div>
      )
    case 'bigPolaroid': {
      const domain = PHOTO_DOMAINS[item.id % PHOTO_DOMAINS.length]
      const label = PIN_EVIDENCE_LABELS[item.id % PIN_EVIDENCE_LABELS.length]
      return (
        <div style={{ ...base, width: 150, height: 180, background: '#fff', padding: 8, borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '4px 6px 14px rgba(0,0,0,0.25)', zIndex: 4 }}>
          <div style={{ width: '100%', height: 120, background: '#7a6a5a', overflow: 'hidden', position: 'relative' }}>
            <img src={`/photos/${domain}.jpg`} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', filter: 'sepia(0.4) contrast(1.1) brightness(0.9)' }} onError={e => { e.target.style.display = 'none' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 13, color: '#333', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>{label}</div>
        </div>
      )
    }
    case 'bigDocument':
      return (
        <div style={{ ...base, width: 180, height: 140, background: '#e8dcc8', padding: '12px 14px', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '4px 5px 12px rgba(0,0,0,0.2)', zIndex: 4, borderLeft: '3px solid #cc3333' }}>
          <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: 7, color: '#888', letterSpacing: '0.12em', marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1.3 }}>{item.text}</div>
          <div style={{ height: 4, background: '#bbb', marginBottom: 4, width: '95%', borderRadius: 1 }} />
          <div style={{ height: 4, background: '#ccc', marginBottom: 4, width: '80%', borderRadius: 1 }} />
          <div style={{ height: 4, background: '#ccc', marginBottom: 4, width: '88%', borderRadius: 1 }} />
          <div style={{ height: 4, background: '#ddd', width: '65%', borderRadius: 1 }} />
        </div>
      )
    case 'bigLetter':
      return (
        <div style={{ ...base, width: 130, height: 160, background: '#f5f0e0', padding: '14px 12px', borderRadius: 1, transform: `rotate(${item.rot}deg)`, boxShadow: '3px 5px 12px rgba(0,0,0,0.18)', zIndex: 4, backgroundImage: 'repeating-linear-gradient(transparent, transparent 22px, rgba(100,140,180,0.1) 22px, rgba(100,140,180,0.1) 23px)' }}>
          <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 18, color: '#333', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>{item.text}</div>
          <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 11, color: '#888', marginTop: 'auto', paddingTop: 12 }}>- ReddX</div>
        </div>
      )
    case 'redCircle':
      return <div style={{ ...base, width: item.size, height: item.size, borderRadius: '50%', border: '2px solid rgba(194,48,48,0.3)' }} />
    default:
      return null
  }
}

// === STYLES ===
const styles = {
  viewport: {
    position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 5,
    background: 'radial-gradient(ellipse 130% 100% at 50% 30%, #6b5038 0%, #5a4228 40%, #4a3620 70%, #3e2e1a 100%)',
  },
  board: { position: 'absolute', top: 0, left: 0, willChange: 'transform' },
  spotlight: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 500px 450px at 50% 45%, rgba(255,210,140,0.08) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 15, transition: 'opacity 1.5s ease',
  },
  nodeContainer: { position: 'absolute', width: NODE_WIDTH, zIndex: 5 },
  pushpin: { position: 'absolute', top: -8, left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: '50%', zIndex: 6, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 3px 6px rgba(0,0,0,0.35)' },
  pinHighlight: { position: 'absolute', top: 3, left: 4, width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' },
  tape: { position: 'absolute', width: 50, height: 16, background: 'rgba(240,230,160,0.45)', zIndex: 7, borderRadius: 1 },
  card: { background: 'var(--paper-cream)', padding: '24px 20px 18px', borderRadius: 2, border: '1px solid', position: 'relative', transition: 'box-shadow 0.5s ease, border-color 0.5s ease', minHeight: 220, wordWrap: 'break-word' },
  nodeNumber: { position: 'absolute', top: -14, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#222', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  domainStamp: { fontFamily: 'var(--font-typewriter)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', border: '1.5px solid', borderRadius: 2, display: 'inline-block' },
  delay: { fontFamily: 'var(--font-handwriting)', fontSize: 18, fontWeight: 700, color: '#8a1a1a' },
  headline: { fontFamily: 'var(--font-typewriter)', fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: '#111', marginBottom: 12, wordBreak: 'break-word', overflowWrap: 'break-word' },
  sourceLink: { display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginBottom: 10, color: '#1a2a5a' },
  sourceIcon: { fontSize: 12 },
  sourceName: { fontFamily: 'var(--font-mono)', fontSize: 9, borderBottom: '1px solid #1a2a5a', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260, display: 'inline-block' },
  severityBar: { height: 3, borderRadius: 1, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  severityFill: { height: '100%', borderRadius: 1, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' },
  annotation: { position: 'absolute', bottom: 8, right: 8, fontFamily: 'var(--font-handwriting)', fontSize: 16, fontWeight: 700, color: '#cc2222', transform: 'rotate(-3deg)', pointerEvents: 'none', whiteSpace: 'nowrap' },
  reddxContainer: { position: 'fixed', bottom: -80, right: -20, zIndex: 50, transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease', pointerEvents: 'none', overflow: 'hidden', height: '90vh', width: '45vw', maxWidth: 700 },
  reddxImage: { width: '100%', height: '130%', objectFit: 'cover', objectPosition: 'top center', filter: 'drop-shadow(8px 8px 16px rgba(0,0,0,0.5))' },
  vignetteLeft: { position: 'fixed', left: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, rgba(50,35,20,0.95), transparent)', zIndex: 20, pointerEvents: 'none' },
  vignetteRight: { position: 'fixed', right: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to left, rgba(50,35,20,0.95), transparent)', zIndex: 20, pointerEvents: 'none' },
  vignetteTop: { position: 'fixed', left: 0, right: 0, top: 0, height: 100, background: 'linear-gradient(to bottom, rgba(50,35,20,0.7), transparent)', zIndex: 20, pointerEvents: 'none' },
  vignetteBottom: { position: 'fixed', left: 0, right: 0, bottom: 0, height: 100, background: 'linear-gradient(to top, rgba(50,35,20,0.9), transparent)', zIndex: 20, pointerEvents: 'none' },
  progressBar: { position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 200, height: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 2, zIndex: 60, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#c23030', borderRadius: 2, transition: 'width 0.5s ease' },
  progressText: { position: 'absolute', top: -18, right: 0, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa' },
}
