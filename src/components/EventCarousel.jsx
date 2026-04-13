import { useState, useRef, useCallback, useEffect } from 'react'

const SEVERITY_COLORS = {
  1: '#44884a', 2: '#88a444', 3: '#cc9922', 4: '#cc6622', 5: '#cc3333',
}

const CARD_WIDTH = 360

const getRotation = (offset) => {
  if (offset === 0) return 0
  return offset * 1.5 + (offset > 0 ? 0.5 : -0.5)
}

export function EventCarousel({ events, onSelect, transitioningId, autoPlayDelay = 0 }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoveredPos, setHoveredPos] = useState(null)
  const autoPlayRef = useRef(null)
  const total = events.length
  const wrap = (i) => ((i % total) + total) % total

  const isTransitioning = transitioningId != null
  const hasTransitioningCard = events.some(e => e.id === transitioningId)

  const getVisibleCards = useCallback(() => {
    return [-2, -1, 0, 1, 2].map(offset => ({
      offset,
      index: wrap(activeIndex + offset),
      event: events[wrap(activeIndex + offset)],
    }))
  }, [activeIndex, events, total])

  const navigate = useCallback((direction) => {
    if (isAnimating || isTransitioning) return
    setIsAnimating(true)
    setActiveIndex(prev => wrap(prev + direction))
    setTimeout(() => setIsAnimating(false), 450)
  }, [isAnimating, isTransitioning, total])

  const jumpTo = useCallback((offset) => {
    if (isAnimating || isTransitioning) return
    setIsAnimating(true)
    setActiveIndex(prev => wrap(prev + offset))
    setTimeout(() => setIsAnimating(false), 450)
  }, [isAnimating, isTransitioning, total])

  useEffect(() => {
    const handleKey = (e) => {
      if (isTransitioning) return
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'Enter') onSelect(events[activeIndex])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate, activeIndex, events, onSelect, isTransitioning])

  useEffect(() => {
    if (isTransitioning) return
    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        if (!hoveredPos) navigate(1)
      }, 7000)
    }
    const delayId = setTimeout(startAutoPlay, autoPlayDelay)
    return () => { clearTimeout(delayId); clearInterval(autoPlayRef.current) }
  }, [navigate, hoveredPos, isTransitioning, autoPlayDelay])

  const touchStart = useRef(null)
  const handleTouchStart = (e) => { if (!isTransitioning) touchStart.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStart.current === null || isTransitioning) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1)
    touchStart.current = null
  }

  const visibleCards = getVisibleCards()

  return (
    <div style={styles.wrapper} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>


      <div style={styles.stage}>
        {visibleCards.map(({ offset, index, event }) => {
          const color = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS[3]
          const isCenter = offset === 0
          const isAdjacent = Math.abs(offset) === 1
          const isFar = Math.abs(offset) === 2
          const isHovered = isCenter && hoveredPos === 'center' && !isTransitioning
          const rot = getRotation(offset)

          const isSelectedCard = isTransitioning && event.id === transitioningId && isCenter
          const shouldFadeCard = isTransitioning && !isSelectedCard

          const translateX = offset * (CARD_WIDTH * 0.85)
          const scale = isCenter ? 1 : isAdjacent ? 0.85 : 0.72
          const baseOpacity = isCenter ? 1 : isAdjacent ? 0.5 : 0.2
          const opacity = shouldFadeCard ? 0 : baseOpacity
          const zIndex = isCenter ? 10 : isAdjacent ? 5 : 1

          return (
            <div
              key={event.id}
              style={{
                position: 'absolute',
                transform: `translateX(${translateX}px) scale(${isHovered ? 1.04 : scale})`,
                opacity,
                zIndex,
                transition: isTransitioning
                  ? 'opacity 0.8s ease 0.3s, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: isTransitioning ? 'none' : 'auto',
              }}
            >
              <button
                className={isSelectedCard ? 'card-select' : ''}
                onClick={() => isCenter ? onSelect(event) : jumpTo(offset)}
                onMouseEnter={() => setHoveredPos(isCenter ? 'center' : offset > 0 ? 'right' : 'left')}
                onMouseLeave={() => setHoveredPos(null)}
                style={{
                  ...styles.card,
                  transform: `rotate(${isHovered ? 0 : rot}deg)`,
                  cursor: 'pointer',
                  boxShadow: isHovered
                    ? '6px 10px 30px rgba(0,0,0,0.4), 0 0 40px rgba(194,48,48,0.08)'
                    : isCenter
                      ? '4px 6px 20px rgba(0,0,0,0.35)'
                      : '2px 3px 10px rgba(0,0,0,0.2)',
                  transformOrigin: 'top center',
                }}
              >
                {/* Pushpin — drops away when this card is transitioning */}
                <div style={{
                  ...styles.cardPin,
                  background: color,
                  transform: isSelectedCard
                    ? 'translateY(600px) rotate(180deg) scale(0.1)'
                    : 'translateY(0) rotate(0deg) scale(1)',
                  opacity: isSelectedCard ? 0 : 1,
                  transition: 'transform 0.6s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.3s ease 0.35s',
                }}>
                  <div style={styles.cardPinHighlight} />
                </div>

                {/* Tape strips */}
                <div style={{ ...styles.tape, top: -4, left: 20, transform: 'rotate(-8deg)' }} />
                <div style={{ ...styles.tape, top: -4, right: 20, transform: 'rotate(5deg)' }} />

                <div style={styles.cardInner}>
                  {event.tag && (
                    <div style={{
                      ...styles.cardTag,
                      background: event.tag === 'historical' ? '#44884a' : '#cc9922',
                    }}>
                      {event.tag === 'historical' ? 'CONFIRMED' : 'PROJECTED'}
                    </div>
                  )}

                  <div style={styles.cardCategory}>{event.category.toUpperCase()}</div>

                  <h3 style={styles.cardTitle}>{event.title}</h3>

                  <div style={styles.divider} />

                  <p style={styles.cardSubtitle}>"{event.subtitle}"</p>

                  <div style={styles.cardBottom}>
                    <span style={styles.rippleCount}>
                      {event.rippleCount || event.ripples?.length || '?'} connections found
                    </span>
                    <span style={{ ...styles.severityStamp, color: color, borderColor: color }}>
                      {['', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'CATASTROPHIC'][event.severity]}
                    </span>
                  </div>

                  {isCenter && !isTransitioning && (
                    <div style={{ ...styles.cta, opacity: isHovered ? 1 : 0.4 }}>
                      pull the thread &rarr;
                    </div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>



      <div style={{
        ...styles.indicators,
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}>
        {events.map((event, i) => (
          <button
            key={event.id}
            onClick={() => { if (!isAnimating && !isTransitioning) { setIsAnimating(true); setActiveIndex(i); setTimeout(() => setIsAnimating(false), 450) } }}
            style={{
              ...styles.dot,
              background: activeIndex === i ? SEVERITY_COLORS[event.severity] : 'rgba(255,255,255,0.15)',
              width: activeIndex === i ? 24 : 8,
            }}
          />
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative', height: 460,
    display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none',
  },

  stage: {
    position: 'relative', width: '100%', height: 400,
    display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1000,
  },
  card: {
    position: 'relative', width: CARD_WIDTH, minHeight: 340,
    background: 'var(--paper-cream)', border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 3, padding: 0, textAlign: 'left',
    fontFamily: 'inherit', color: '#111',
    transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
    overflow: 'visible',
  },
  cardPin: {
    position: 'absolute', top: -7, left: '50%', marginLeft: -8,
    width: 16, height: 16, borderRadius: '50%', zIndex: 5,
    border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  },
  cardPinHighlight: {
    position: 'absolute', top: 2, left: 3, width: 5, height: 5,
    borderRadius: '50%', background: 'rgba(255,255,255,0.4)',
  },
  tape: {
    position: 'absolute', width: 50, height: 16,
    background: 'rgba(240, 230, 160, 0.5)', zIndex: 4, borderRadius: 1,
  },
  cardInner: {
    padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', minHeight: 340,
  },
  cardTag: {
    alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 8,
    fontWeight: 700, letterSpacing: '0.12em', color: '#fff',
    padding: '3px 8px', borderRadius: 2, marginBottom: 10,
  },
  cardCategory: {
    fontFamily: 'var(--font-typewriter)', fontSize: 10, letterSpacing: '0.1em',
    color: '#555', marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'var(--font-handwriting)', fontSize: 28, fontWeight: 700,
    lineHeight: 1.15, color: '#111', marginBottom: 10, padding: '0 0 4px 0',
  },
  divider: {
    width: '100%', height: 2, background: 'var(--string-red)',
    opacity: 0.4, marginBottom: 10, borderRadius: 1,
  },
  cardSubtitle: {
    fontFamily: 'var(--font-typewriter)', fontSize: 13, color: '#444',
    fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5,
  },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 'auto', marginBottom: 12,
  },
  rippleCount: {
    fontFamily: 'var(--font-handwriting)', fontSize: 18, fontWeight: 600, color: '#8a1a1a',
  },
  severityStamp: {
    fontFamily: 'var(--font-typewriter)', fontSize: 8, fontWeight: 700,
    letterSpacing: '0.12em', padding: '3px 7px', border: '1.5px solid',
    borderRadius: 2, transform: 'rotate(-2deg)', display: 'inline-block',
  },
  cta: {
    fontFamily: 'var(--font-handwriting)', fontSize: 20, fontWeight: 600,
    color: '#cc2222', transition: 'opacity 0.3s ease', textAlign: 'center',
  },

  indicators: {
    display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', marginTop: 4,
  },
  dot: {
    height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
    padding: 0, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
}
