const SEVERITY_COLORS = {
  1: '#44884a', 2: '#88a444', 3: '#cc9922', 4: '#cc6622', 5: '#cc3333',
}

const PIN_COLORS = ['#cc3333', '#3366aa', '#44884a', '#cc9922', '#3366aa', '#cc3333', '#44884a']

const DOMAIN_LABELS = {
  commodities: 'COMMODITIES', finance: 'FINANCE', logistics: 'LOGISTICS',
  energy: 'ENERGY', agriculture: 'AGRICULTURE', consumer: 'CONSUMER',
  personal: 'PERSONAL', markets: 'MARKETS', regulation: 'REGULATION',
  employment: 'EMPLOYMENT', 'real estate': 'REAL ESTATE', media: 'MEDIA',
  advertising: 'ADVERTISING', manufacturing: 'MANUFACTURING',
  geopolitics: 'GEOPOLITICS', culture: 'CULTURE', technology: 'TECHNOLOGY',
}

// Slight random rotation for each card to look pinned haphazardly
const getRotation = (i) => {
  const rots = [-2.5, 1.8, -1.2, 2.1, -0.8, 1.5, -1.9, 0.9, -2.2, 1.1]
  return rots[i % rots.length]
}

export function CascadeViz({ ripples, activeRipple, severity }) {
  return (
    <div style={styles.container}>
      {/* Trigger pushpin */}
      <div style={styles.triggerArea}>
        <div style={{
          ...styles.triggerPin,
          background: '#cc3333',
          boxShadow: activeRipple >= 0
            ? '0 0 20px rgba(194, 48, 48, 0.4), 0 2px 4px rgba(0,0,0,0.3)'
            : '0 2px 4px rgba(0,0,0,0.3)',
        }} />
        <span style={styles.triggerLabel}>TRIGGER EVENT</span>
      </div>

      {/* Red string line (vertical) */}
      <div style={{
        ...styles.stringVertical,
        height: activeRipple >= 0 ? '100%' : 0,
        background: 'var(--string-red)',
        boxShadow: '0 0 6px var(--string-glow)',
      }} />

      {/* Ripple chain as pinned clippings */}
      <div style={styles.chain}>
        {ripples.map((ripple, i) => {
          const isActive = i <= activeRipple
          const isCurrent = i === activeRipple
          const color = SEVERITY_COLORS[ripple.severity]
          const pinColor = PIN_COLORS[i % PIN_COLORS.length]
          const rot = getRotation(i)

          return (
            <div key={ripple.id} style={styles.rippleRow}>
              {/* String connector + pushpin */}
              <div style={styles.connectorCol}>
                {/* String segment */}
                <div style={{
                  ...styles.string,
                  background: isActive ? 'var(--string-red)' : 'transparent',
                  boxShadow: isActive ? '0 0 4px var(--string-glow)' : 'none',
                }} />
                {/* Pushpin */}
                <div style={{
                  ...styles.pushpin,
                  background: isActive ? pinColor : '#666',
                  boxShadow: isActive
                    ? `0 2px 6px rgba(0,0,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.2)`
                    : '0 1px 3px rgba(0,0,0,0.2)',
                  transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                  animation: isCurrent ? 'pinDrop 0.4s ease both' : 'none',
                }}>
                  {/* Pin highlight */}
                  <div style={styles.pinHighlight} />
                </div>
                {/* Next string segment */}
                {i < ripples.length - 1 && (
                  <div style={{
                    ...styles.string,
                    background: isActive && i < activeRipple ? 'var(--string-red)' : 'transparent',
                    boxShadow: isActive && i < activeRipple ? '0 0 4px var(--string-glow)' : 'none',
                  }} />
                )}
              </div>

              {/* Newspaper clipping card */}
              <div style={{
                ...styles.clipping,
                '--rot': `${rot}deg`,
                transform: `rotate(${rot}deg)`,
                opacity: isActive ? 1 : 0.2,
                animation: isCurrent ? 'paperSlap 0.5s ease both' : 'none',
                boxShadow: isCurrent
                  ? '4px 6px 16px rgba(0,0,0,0.35), 0 0 30px rgba(194,48,48,0.1)'
                  : '2px 3px 8px rgba(0,0,0,0.2)',
              }}>
                {/* Torn top edge effect */}
                <div style={styles.tornEdge} />

                {/* Domain stamp */}
                <div style={styles.clippingHeader}>
                  <span style={{
                    ...styles.domainStamp,
                    color: color,
                    borderColor: color,
                  }}>
                    {DOMAIN_LABELS[ripple.domain] || ripple.domain.toUpperCase()}
                  </span>
                  <span style={styles.delay}>
                    {ripple.delay}
                  </span>
                </div>

                {/* Headline */}
                <p style={styles.headline}>{ripple.headline}</p>

                {/* Source */}
                {ripple.source && (
                  <a
                    href={ripple.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.sourceLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={styles.sourceIcon}>&#128206;</span>
                    <span style={styles.sourceName}>{ripple.source.title}</span>
                  </a>
                )}

                {/* Severity — hand-drawn underline */}
                <div style={styles.severityBar}>
                  <div style={{
                    ...styles.severityFill,
                    width: isActive ? `${ripple.severity * 20}%` : '0%',
                    background: color,
                  }} />
                </div>

                {/* Handwritten annotation */}
                {isCurrent && (
                  <div style={styles.annotation}>
                    {ripple.severity >= 4 ? 'THIS IS BAD !!' :
                     ripple.severity >= 3 ? 'watch this one...' :
                     ripple.severity >= 2 ? 'hmm...' : 'and then...'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px',
    marginBottom: 40,
    position: 'relative',
  },
  triggerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    zIndex: 2,
  },
  triggerPin: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    transition: 'box-shadow 0.5s ease',
    border: '2px solid rgba(255,255,255,0.2)',
  },
  triggerLabel: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 10,
    letterSpacing: '0.15em',
    color: 'var(--text-light)',
  },
  stringVertical: {
    position: 'absolute',
    top: 40,
    left: '50%',
    marginLeft: -1,
    width: 2,
    transition: 'height 2s ease',
    zIndex: 0,
    pointerEvents: 'none',
  },
  chain: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 580,
    position: 'relative',
    zIndex: 1,
  },
  rippleRow: {
    display: 'flex',
    gap: 18,
    alignItems: 'stretch',
  },
  connectorCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 24,
    flexShrink: 0,
  },
  string: {
    width: 2,
    flex: 1,
    minHeight: 10,
    transition: 'all 0.5s ease',
  },
  pushpin: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'all 0.3s ease',
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  pinHighlight: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
  },
  clipping: {
    flex: 1,
    background: 'var(--paper-cream)',
    padding: '16px 18px 14px',
    borderRadius: 2,
    marginBottom: 10,
    transition: 'opacity 0.5s ease',
    position: 'relative',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  tornEdge: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 3,
    background: 'linear-gradient(90deg, var(--paper-cream) 2px, transparent 2px, transparent 4px, var(--paper-cream) 4px, var(--paper-cream) 7px, transparent 7px, transparent 8px, var(--paper-cream) 8px)',
    backgroundSize: '10px 3px',
  },
  clippingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainStamp: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '2px 6px',
    border: '1.5px solid',
    borderRadius: 2,
    transform: 'rotate(-1deg)',
    display: 'inline-block',
  },
  delay: {
    fontFamily: 'var(--font-handwriting)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--ink-red)',
  },
  headline: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.45,
    color: 'var(--ink-dark)',
    marginBottom: 8,
  },
  sourceLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
    marginBottom: 8,
    color: 'var(--ink-blue)',
  },
  sourceIcon: {
    fontSize: 12,
  },
  sourceName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.02em',
    borderBottom: '1px solid var(--ink-blue)',
    lineHeight: 1.2,
  },
  severityBar: {
    height: 3,
    borderRadius: 1,
    background: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  severityFill: {
    height: '100%',
    borderRadius: 1,
    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  annotation: {
    position: 'absolute',
    bottom: -8,
    right: 10,
    fontFamily: 'var(--font-handwriting)',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--marker-red)',
    transform: 'rotate(-3deg)',
    pointerEvents: 'none',
    animation: 'scribble 0.4s ease both',
  },
}
