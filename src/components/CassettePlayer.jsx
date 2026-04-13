export function CassettePlayer({ isPlaying, onPlay, onRewind, onForward, onStop, activeRipple, rippleCount, severity, eventTitle }) {
  const progress = rippleCount > 0 ? ((activeRipple + 1) / rippleCount) : 0
  const leftReelSize = 28 - progress * 12
  const rightReelSize = 16 + progress * 12

  return (
    <div style={styles.wrapper}>
      <div style={styles.body}>
        {/* Top chrome */}
        <div style={styles.topStrip}>
          <div style={styles.screwHole} />
          <div style={styles.brandText}>TIMELINE MANIPULATOR</div>
          <div style={styles.screwHole} />
        </div>

        {/* Tape window */}
        <div style={styles.tapeWindow}>
          <div style={styles.reelContainer}>
            <div style={{
              ...styles.reel, width: leftReelSize, height: leftReelSize,
              animation: isPlaying ? 'reel-spin 1.5s linear infinite' : 'none',
            }}>
              <div style={styles.reelHub} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(0deg)' }} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(120deg)' }} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(240deg)' }} />
            </div>
          </div>

          <div style={styles.tapeLabel}>
            <div style={styles.tapeLabelTitle}>
              {eventTitle ? eventTitle.substring(0, 30) : 'NO TAPE'}
            </div>
            <div style={styles.tapeLabelSub}>
              SIDE A • {rippleCount} TRACKS
            </div>
          </div>

          <div style={styles.reelContainer}>
            <div style={{
              ...styles.reel, width: rightReelSize, height: rightReelSize,
              animation: isPlaying ? 'reel-spin 1.2s linear infinite' : 'none',
            }}>
              <div style={styles.reelHub} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(0deg)' }} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(120deg)' }} />
              <div style={{ ...styles.reelSpoke, transform: 'rotate(240deg)' }} />
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={styles.controlsRow}>

          <div style={styles.transportButtons}>
            {/* Rewind */}
            <button onClick={onRewind} style={styles.transportBtn} title="Previous">
              <div style={{ display: 'flex', gap: 1 }}>
                <div style={{ ...styles.rewindTriangle, borderRight: '6px solid #ddd' }} />
                <div style={{ ...styles.rewindTriangle, borderRight: '6px solid #ddd' }} />
              </div>
            </button>

            {/* Stop */}
            <button onClick={onStop} style={styles.transportBtn} title="Stop">
              <div style={{ width: 8, height: 8, background: '#ddd', borderRadius: 1 }} />
            </button>

            {/* Play */}
            <button
              onClick={onPlay}
              style={{
                ...styles.transportBtn,
                background: isPlaying
                  ? 'linear-gradient(180deg, #4a3a3a 0%, #3a2a2a 100%)'
                  : 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
                boxShadow: isPlaying
                  ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
                  : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              title="Play"
            >
              <div style={styles.playTriangle} />
            </button>

            {/* Forward */}
            <button onClick={onForward} style={styles.transportBtn} title="Next">
              <div style={{ display: 'flex', gap: 1 }}>
                <div style={{ ...styles.forwardTriangle, borderLeft: '6px solid #ddd' }} />
                <div style={{ ...styles.forwardTriangle, borderLeft: '6px solid #ddd' }} />
              </div>
            </button>
          </div>

          <div style={styles.recordIndicator}>
            <div style={{
              ...styles.recordLight,
              background: isPlaying ? '#cc3333' : '#442222',
              boxShadow: isPlaying ? '0 0 8px rgba(204,48,48,0.6)' : 'none',
              animation: isPlaying ? 'record-blink 2s ease-in-out infinite' : 'none',
            }} />
            <span style={styles.recordLabel}>{isPlaying ? 'PLAYING' : 'READY'}</span>
          </div>
        </div>

        {/* Bottom chrome */}
        <div style={styles.bottomStrip}>
          <div style={styles.ventSlot} />
          <div style={styles.ventSlot} />
          <div style={styles.ventSlot} />
          <div style={styles.ventSlot} />
          <div style={styles.ventSlot} />
        </div>
      </div>

      <style>{`
        @keyframes reel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes record-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

const styles = {
  wrapper: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80 },
  body: {
    width: 380,
    background: 'linear-gradient(180deg, #2a2420 0%, #1e1a16 50%, #2a2420 100%)',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  topStrip: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 12px',
    background: 'linear-gradient(180deg, #3a3430 0%, #2e2a26 100%)',
    borderBottom: '1px solid rgba(0,0,0,0.3)',
  },
  screwHole: {
    width: 6, height: 6, borderRadius: '50%', background: '#1a1614',
    border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
  },
  brandText: {
    fontFamily: 'var(--font-mono)', fontSize: 7, fontWeight: 700,
    letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase',
  },
  tapeWindow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', margin: '8px 12px',
    background: 'linear-gradient(180deg, rgba(180,160,120,0.15) 0%, rgba(140,120,80,0.08) 100%)',
    borderRadius: 4, border: '1px solid rgba(255,255,255,0.04)',
    minHeight: 50,
  },
  reelContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  reel: {
    borderRadius: '50%', background: '#1a1614', border: '2px solid #333',
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  reelHub: { width: 6, height: 6, borderRadius: '50%', background: '#555', position: 'absolute' },
  reelSpoke: { position: 'absolute', width: 1, height: '80%', background: '#444', transformOrigin: 'center center' },
  tapeLabel: { flex: 1, textAlign: 'center', padding: '0 8px' },
  tapeLabelTitle: {
    fontFamily: 'var(--font-typewriter)', fontSize: 8, fontWeight: 700,
    color: '#bba', letterSpacing: '0.05em', marginBottom: 2,
    textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', maxWidth: 200,
  },
  tapeLabelSub: { fontFamily: 'var(--font-mono)', fontSize: 7, color: '#887', letterSpacing: '0.1em' },
  controlsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 16px 8px',
  },
  transportButtons: { display: 'flex', gap: 4, alignItems: 'center' },
  transportBtn: {
    width: 32, height: 26, borderRadius: 3, border: '1px solid #444',
    background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    padding: 0, transition: 'transform 0.05s',
  },
  playTriangle: {
    width: 0, height: 0,
    borderLeft: '8px solid #ddd', borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
    marginLeft: 2,
  },
  rewindTriangle: {
    width: 0, height: 0,
    borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
  },
  forwardTriangle: {
    width: 0, height: 0,
    borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
  },
  recordIndicator: { display: 'flex', alignItems: 'center', gap: 6 },
  recordLight: { width: 8, height: 8, borderRadius: '50%', transition: 'all 0.3s ease' },
  recordLabel: {
    fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
    color: '#777', letterSpacing: '0.1em',
  },
  bottomStrip: {
    display: 'flex', justifyContent: 'center', gap: 8, padding: '4px 0 6px',
    background: 'linear-gradient(180deg, #2e2a26 0%, #3a3430 100%)',
    borderTop: '1px solid rgba(0,0,0,0.3)',
  },
  ventSlot: { width: 20, height: 2, borderRadius: 1, background: '#1a1614' },
}
