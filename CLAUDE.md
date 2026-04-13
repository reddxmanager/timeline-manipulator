# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Consequencpiracy** — a conspiracy corkboard web experience for ElevenHacks #4 (Turbopuffer x ElevenLabs). Users select or enter a world event, and the app traces a chain of ripple consequences across industries, narrated by the ReddX character over noir jazz music on a visual corkboard with red string connections.

## Commands

```bash
npm run dev          # Start Vite dev server on port 3000
npm run build        # Production build (output: dist/)
npm run preview      # Preview production build

# Cache generation (requires ELEVENLABS_API_KEY + ANTHROPIC_API_KEY in .env.local)
npm run cache                    # Generate all event caches
npm run cache:hormuz             # Single event
npm run cache:svb                # Single event
npm run cache:fresh              # All events fresh
npm run cache:narration-only     # Only TTS narration for hormuz
npm run cache:music-only         # Only music for hormuz

npm run seed         # Seed Turbopuffer with historical event data
npm run test-music   # Test ElevenLabs Music API
```

All Node scripts use `--env-file=.env.local` to load environment variables.

## Architecture

### Data Flow
1. User selects an event from the carousel (or types a custom one)
2. App loads pre-cached `analysis.json` + audio files from `/public/cache/{eventId}/`
3. For live events: Netlify Function calls Claude API (builds ripple chain) + Turbopuffer (finds historical parallels)
4. Audio playback is **event-driven** — each ripple's narration `.onended` triggers the next ripple, NOT timer-based

### Key Layers

- **Frontend** (`src/`): React 18 + Vite, inline styles (no CSS modules), D3 for potential dataviz, Framer Motion for animations
- **Serverless Backend** (`netlify/functions/`): Two Netlify Functions handle live event analysis and audio generation
- **Cache System** (`scripts/generate-cache.js` → `public/cache/{eventId}/`): Pre-generates all audio + analysis for carousel events. This is how the demo works — everything is pre-cached, no live API calls needed during playback

### Frontend Components

- `App.jsx` — Main orchestrator. Manages playback state machine (`home` → `loading` → `playing`), audio refs, and the event-driven ripple chain scheduling. Pose selection for ReddX is severity-based.
- `CorkBoard.jsx` — Full-screen horizontally-pannable corkboard. Renders SVG red string paths, ripple cards with pushpins/tape, scattered "junk" items (sticky notes, coffee stains, scraps). Camera follows active node via CSS transform.
- `EventCarousel.jsx` — 3D card carousel with rotation, scaling, auto-advance, keyboard nav, and touch support. Cards styled as newspaper clippings.
- `AudioBar.jsx` — Fixed bottom audio control bar with waveform visualization and progress tracking.
- `CustomInput.jsx` — Sticky note styled input for custom events (not yet wired to live generation).

### Audio Architecture
All audio uses HTML5 `Audio` elements. Per event:
- `music.mp3` — 4-minute looping noir jazz
- `narration-{n}.mp3` — Per-ripple TTS (ReddX voice clone)
- `sfx-{n}.mp3` — Per-ripple domain-appropriate sound effects

Volume levels: music 0.15 default, 0.08 during narration, 0.2 post-narration, 0.25 during transitions. SFX 0.3. Narration 0.9.

### Serverless Functions

- `netlify/functions/analyze.js` → `/api/analyze`: Queries Turbopuffer for semantic parallels, then Claude builds the ripple chain with musical parameters and real sources
- `netlify/functions/generate-audio.js` → `/api/generate-audio`: Proxies to ElevenLabs Music, SFX, and TTS APIs

### Cache Structure
```
public/cache/{eventId}/
  analysis.json         — Ripple chain + metadata from Claude
  narration-scripts.json — Text scripts for reference
  narration-1.mp3       — Per-ripple TTS narration
  music.mp3             — 4 min noir jazz (loopable)
  sfx-1.mp3             — Per-ripple sound effects
```

Available event IDs: `hormuz`, `svb`, `mrbeast`, `suez`, `suez-real`, `tyson`, `gamestop`

## Environment Variables

See `.env.example`. Required in `.env.local`:
- `ELEVENLABS_API_KEY` — Music, SFX, and TTS generation
- `ANTHROPIC_API_KEY` — Claude analysis (uses `claude-sonnet-4-20250514`)
- `TURBOPUFFER_API_KEY` — Semantic search for historical parallels
- `REDDX_VOICE_ID` / `GUBBINS_VOICE_ID` — ElevenLabs voice clone IDs

## Design System

- **Fonts**: Caveat (handwriting), Special Elite (typewriter), DM Sans (body), JetBrains Mono (mono) — loaded via Google Fonts in `index.html`
- **CSS variables** defined in `src/index.css` — `--cork-*`, `--paper-*`, `--string-red`, `--severity-1` through `--severity-5`, `--font-*`
- **Severity colors**: 1=#44884a, 2=#88a444, 3=#cc9922, 4=#cc6622, 5=#cc3333
- **ReddX poses** at `/public/reddx/`: `Question`, `Plotting`, `shocked`, `informative`, `cig`, `shrugging`, `base`, `big brain time`, `Deal_with_it`, `gossip`, `Source` — most have `-blink.png` variants

## Key Conventions

- Styles are inline JS objects (not CSS classes), defined as `const styles = {}` at the bottom of each component
- Playback timing is event-driven via `narration.onended`, never `setInterval`
- The narrator personality is absurdist YouTube energy, NOT serious/formal. Last ripple is always a comedic punchline about something mundane
- Music is always noir jazz. The personality/music contrast is intentional
- Deployed to Netlify (`netlify.toml` configures build + SPA redirects)
