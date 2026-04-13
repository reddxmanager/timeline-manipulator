import { useState } from 'react'

export function CustomInput({ onSubmit }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or open a new case</span>
        <div style={styles.dividerLine} />
      </div>

      <div style={{
        ...styles.stickyNote,
        transform: isFocused ? 'rotate(0deg) scale(1.02)' : 'rotate(-1.5deg)',
        boxShadow: isFocused
          ? '4px 6px 20px rgba(0,0,0,0.3), 0 0 30px rgba(194,48,48,0.05)'
          : '3px 4px 12px rgba(0,0,0,0.2)',
      }}>
        {/* Pushpin */}
        <div style={styles.pin}>
          <div style={styles.pinHighlight} />
        </div>

        <label style={styles.label}>WHAT HAPPENS WHEN...</label>

        <div style={styles.inputRow}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder="China bans rare earth exports..."
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            ...styles.submitButton,
            opacity: value.trim() ? 1 : 0.4,
            cursor: value.trim() ? 'pointer' : 'default',
          }}
        >
          Pull the thread &rarr;
        </button>

        <p style={styles.hint}>
          try: "Taylor Swift cancels world tour" or "NVIDIA stock hits $300"
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    background: 'var(--string-red)',
    opacity: 0.2,
  },
  dividerText: {
    fontFamily: 'var(--font-handwriting)',
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--text-on-dark)',
    whiteSpace: 'nowrap',
  },
  stickyNote: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--paper-yellow)',
    padding: '32px 28px 24px',
    borderRadius: 2,
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  pin: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#cc3333',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  },
  pinHighlight: {
    position: 'absolute',
    top: 2, left: 3,
    width: 4, height: 4,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
  },
  label: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--text-mid)',
    display: 'block',
    marginBottom: 10,
  },
  inputRow: {
    marginBottom: 14,
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--ink-dark)',
    outline: 'none',
    color: 'var(--ink-dark)',
    fontFamily: 'var(--font-handwriting)',
    fontSize: 24,
    fontWeight: 600,
    padding: '8px 0',
  },
  submitButton: {
    width: '100%',
    padding: '10px 0',
    background: 'var(--string-red)',
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontFamily: 'var(--font-handwriting)',
    fontSize: 20,
    fontWeight: 700,
    transition: 'all 0.2s ease',
    marginBottom: 10,
  },
  hint: {
    fontFamily: 'var(--font-typewriter)',
    fontSize: 10,
    color: 'var(--text-mid)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}
