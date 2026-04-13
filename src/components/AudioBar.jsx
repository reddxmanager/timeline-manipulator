import { useMemo } from 'react'

const SEVERITY_COLORS = {
  1: '#44884a', 2: '#88a444', 3: '#cc9922', 4: '#cc6622', 5: '#cc3333',
}

export function AudioBar({ isPlaying, onPlay, rippleCount, activeRipple, severity }) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS[3]

  const bars = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      height: Math.random() * 0.7 + 0.3,
    }))
  }, [])

  const progress = rippleCount > 0 && activeRipple >= 0
    ? ((activeRipple + 1) / rippleCount) * 100
    : 0

  return (
    <div style={styles.container}>
      <div style={styles.bar}>
        {/* Label */}
        <div style={styles.label}>
          <span style={styles.labelIcon}>&#127908;</span>
          <span style={styles.labelText}>EVIDENCE AUDIO</span>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          disabled={isPlaying}
          style={{
            ...styles.playButton,
            background: isPlaying ? 'var(--cork-dark)' : color,
            cursor: isPlaying ? 'default' : 'pointer',
            opacity: isPlaying ? 0.6 : 1,
          }}
        >
          {isPlaying ? (
            <span style={styles.pauseIcon}>
              <span style={styles.pauseBar} />
              <span style={styles.pauseBar} />
            </span>
          ) : (
            <span style={styles.playIcon}>&#9654;</span>
          )}
        </button>

        {/* Waveform */}
        <div style={styles.waveformArea}>
          <div style={styles.waveform}>
            {bars.map((bar, i) => {
              const barProgress = (i / bars.length) * 100
              const isPast = barProgress < progress
              return (
                <div
                  key={i}
                  style={{
                    ...styles.waveBar,
                    height: isPlaying ? `${bar.height * 100}%` : '20%',
                    background: isPast ? color : 'rgba(255,255,255,0.12)',
                    animation: isPlaying && isPast
                      ? `waveform ${0.4 + Math.random() * 0.4}s ease-in-out infinite alternate`
                      : 'none',
                  }}
                />
              )
            })}
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, background: color }} />
          </div>
        </div>

        {/* Status */}
        <div style={styles.status}>
          <span style={{
            ...styles.statusDot,
            background: isPlaying ? '#cc3333' : 'var(--text-light)',
            boxShadow: isPlaying ? '0 0 8px rgba(194,48,48,0.5)' : 'none',
            animation: isPlaying ? 'pulse-glow 1.5s infinite' : 'none',
          }} />
          <span style={styles.statusText}>
            {isPlaying ? `${activeRipple + 1}/${rippleCount}` : 'READY'}
          </span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 36,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    width: '100%',
    maxWidth: 660,
    padding: '0 24px',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'rgba(42, 30, 20, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '2px solid rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding: '10px 18px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  labelIcon: { fontSize: 14 },
  labelText: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 8,
    letterSpacing: '0.1em',
    color: 'var(--text-light)',
    display: 'none', // hide on small screens
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  playIcon: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 2,
  },
  pauseIcon: { display: 'flex', gap: 3 },
  pauseBar: {
    display: 'block',
    width: 3, height: 14,
    background: 'var(--text-on-dark)',
    borderRadius: 1,
  },
  waveformArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveBar: {
    flex: 1,
    minWidth: 2,
    borderRadius: 1,
    transition: 'height 0.3s ease, background 0.3s ease',
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  statusText: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 10,
    color: 'var(--text-light)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.08em',
  },
}
