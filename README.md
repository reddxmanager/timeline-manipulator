# Timeline Manipulator

**ElevenHacks #4 — Turbopuffer x ElevenLabs**

*ReddX Industries has been proudly destabilizing causality for over [REDACTED] years.*

## What Is This?

A conspiracy corkboard that traces the real ripple effects of world events. Pick an event — or type your own — and watch as an AI narrator walks you through the chain of consequences, from global catastrophe down to your morning coffee costing more.

Every event gets its own noir jazz soundtrack, narrated by a sarcastic AI character who finds the interconnectedness of everything genuinely hilarious.

## How It Works

1. **Choose an event** from the carousel (20 pre-loaded) or type your own
2. **Watch the folder open** — the case file shakes, unfolds, and the corkboard reveals itself
3. **Follow the red string** as it zig-zags between consequence cards, each pinned to the board
4. **Listen to ReddX narrate** each ripple with custom voice-cloned audio over noir jazz
5. **Make a decision** — three strategic response choices appear. Pick one.
6. **TIMELINE SHIFT** — the board glitches, reality splits, and traces the consequences of YOUR choice
7. **Drag and zoom** the corkboard to explore the evidence, photos, and easter eggs scattered everywhere

## Tech Stack

### APIs Used (5)

| API | What It Does |
|---|---|
| **ElevenLabs TTS** | Voice-cloned narration for every ripple (ReddX character) |
| **ElevenLabs Music** | Custom noir jazz per event, mood-matched to the crisis |
| **ElevenLabs SFX** | Domain-specific sound effects per consequence card |
| **Turbopuffer** | BM25 full-text search for historical parallels + semantic dedup of custom events |
| **Claude API** | Ripple-effect analysis with web search for real sources, narration scripts, branching |

### Frontend
- React + Vite
- Horizontal corkboard with SVG zig-zag string paths and pushpins
- ReddX PNGTuber with blink animations (18+ poses)
- Cassette tape player with transport controls
- CSS smoke overlay, RGB-split glitch effect, cycling zalgo numbers
- Drag/zoom/keyboard navigation (WASD, scroll, +/-)
- 55+ handwritten sticky notes, 50+ typed scraps, 25+ newspaper headlines with easter eggs

### Backend
- Netlify Functions (serverless)
- `/api/analyze` — Claude with web search + Turbopuffer dedup for custom events
- `/api/branch` — Live branching with web search + retry logic
- `/api/tts` — ElevenLabs voice generation
- `/api/music` — ElevenLabs music generation

### Cache Pipeline
- 20 pre-cached events with full audio (narration + music + SFX)
- `scripts/generate-cache.js` — Analysis -> narration scripts -> TTS -> music -> SFX
- `scripts/generate-all.js` — Batch runner
- `scripts/fetch-photos.js` — Pexels stock photos for polaroid clutter

## Events

### Current Timeline (Confirmed)
Hormuz Crisis, SVB Collapse, Suez Canal, GameStop, COVID-19, ChatGPT, Trump Tariffs, Deepwater Horizon, Fukushima, OPEC Embargo

### Parallel Timeline (Speculative)
MrBeast Amazon Deal, Tyson vs Paul, Suez Blocked Again, TikTok Ban, Bitcoin $1M, Yellowstone Eruption, Internet Goes Dark, Amazon Unionizes, Swift Retires, AGI Open-Sourced

### Custom Events
Type anything. Claude searches the web for real sources. Turbopuffer deduplicates by semantic similarity.

## Running Locally

```bash
npm install
cp .env.example .env.local  # Add your API keys
netlify dev                  # Runs on localhost:9000
```

## Built By

**ReddX Industries** — [@daytondoes](https://github.com/daytondoes)

Built in the Philippines during a power outage. Powered by entropy.
