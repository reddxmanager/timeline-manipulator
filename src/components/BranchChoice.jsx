import { useState, useEffect } from 'react'

const CHOICE_COLORS = ['#f5e6a0', '#a0d4f5', '#f5c0a0']
const CHOICE_ROTS = [-4, 2, -3]

export function BranchChoice({ choices, onChoose, isGenerating, branchResult }) {
  const [selected, setSelected] = useState(null)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  // Reset selection if generation fails (isGenerating goes false without branchResult)
  useEffect(() => {
    if (!isGenerating && !branchResult && selected !== null) {
      setSelected(null)
    }
  }, [isGenerating, branchResult])

  if (!choices || choices.length === 0) return null

  const handlePick = (choice, idx) => {
    if (isGenerating || selected !== null) return
    setSelected(idx)
    onChoose(choice)
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLine} />
        <h3 style={styles.headerText}>
          {branchResult?.roast || (isGenerating ? 'Following the thread...' : 'What would you do?')}
        </h3>
        <div style={styles.headerLine} />
      </div>

      {/* Choice sticky notes */}
      {!branchResult && (
        <div style={styles.choicesRow}>
          {choices.map((choice, i) => {
            const isSelected = selected === i
            const isHovered = hoveredIdx === i
            const isDimmed = selected !== null && !isSelected

            return (
              <button
                key={i}
                onClick={() => handlePick(choice, i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                disabled={isGenerating || selected !== null}
                style={{
                  ...styles.stickyNote,
                  background: CHOICE_COLORS[i % CHOICE_COLORS.length],
                  transform: `rotate(${CHOICE_ROTS[i]}deg) scale(${isHovered && !isDimmed ? 1.08 : isSelected ? 1.05 : 1})`,
                  opacity: isDimmed ? 0.3 : 1,
                  cursor: isGenerating || selected !== null ? 'default' : 'pointer',
                  boxShadow: isSelected
                    ? '4px 6px 20px rgba(0,0,0,0.35), 0 0 20px rgba(194,48,48,0.15)'
                    : isHovered
                      ? '4px 6px 16px rgba(0,0,0,0.3)'
                      : '3px 4px 10px rgba(0,0,0,0.2)',
                }}
              >
                {/* Pushpin */}
                <div style={styles.pin}>
                  <div style={styles.pinHighlight} />
                </div>

                <span style={styles.choiceText}>{choice}</span>

                {isSelected && isGenerating && (
                  <div style={styles.loadingDots}>
                    <span style={{ ...styles.dot, animationDelay: '0s' }}>.</span>
                    <span style={{ ...styles.dot, animationDelay: '0.3s' }}>.</span>
                    <span style={{ ...styles.dot, animationDelay: '0.6s' }}>.</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Generating indicator */}
      {isGenerating && (
        <div style={styles.generatingBar}>
          <div style={styles.generatingFill} />
          <p style={styles.generatingText}>
            Turbopuffer is finding parallels... Claude is tracing consequences... ReddX is warming up...
          </p>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
    zIndex: 30,
    padding: '12px 40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(to bottom, transparent, rgba(30,20,12,0.6) 20%, rgba(30,20,12,0.8) 100%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 700,
  },
  headerLine: {
    flex: 1,
    height: 2,
    background: 'rgba(194, 48, 48, 0.3)',
    borderRadius: 1,
  },
  headerText: {
    fontFamily: 'var(--font-handwriting)',
    fontSize: 28,
    fontWeight: 700,
    color: '#f0ebe0',
    textShadow: '2px 2px 6px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  choicesRow: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 900,
  },
  stickyNote: {
    position: 'relative',
    width: 180,
    minHeight: 90,
    padding: '22px 14px 14px',
    border: 'none',
    borderRadius: 2,
    fontFamily: 'var(--font-handwriting)',
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  pin: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#cc3333',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    zIndex: 2,
  },
  pinHighlight: {
    position: 'absolute',
    top: 2, left: 3,
    width: 5, height: 5,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
  },
  choiceText: {
    display: 'block',
  },
  loadingDots: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 900,
    color: '#8a1a1a',
  },
  dot: {
    display: 'inline-block',
    animation: 'pulse-glow 1s ease-in-out infinite',
  },
  generatingBar: {
    width: '100%',
    maxWidth: 500,
    textAlign: 'center',
  },
  generatingFill: {
    height: 3,
    background: 'var(--string-red)',
    borderRadius: 2,
    animation: 'waveform 2s ease-in-out infinite',
    width: '60%',
    margin: '0 auto 12px',
    opacity: 0.6,
  },
  generatingText: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 11,
    color: '#aaa',
    fontStyle: 'italic',
  },
}
