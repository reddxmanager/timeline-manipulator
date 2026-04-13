# CONSEQUENCPIRACY — Claude Code Vision Prompt

You are building "Consequencpiracy" — a conspiracy corkboard experience that traces the ripple effects of world events, narrated by the ReddX character over noir jazz.

## THE EXPERIENCE (what the user sees)

### Phase 1: The File Opens
When a user selects an event from the carousel, the screen transitions into the experience:
1. A manila folder appears center screen, labeled with the event title. It looks like a classified case file.
2. The folder opens. Inside: a preview of the corkboard with red strings faintly visible.
3. The folder "unfolds" and expands to fill the entire viewport. The cork texture takes over. The folder edges dissolve. Now we're ON the board.
4. This transition should take ~2 seconds. Smooth, cinematic, with a subtle paper-rustling SFX.

### Phase 2: The Corkboard
The full-screen corkboard is a wide horizontal canvas. It extends far to the right, beyond the viewport. Pinned to it:
- Newspaper clippings (the ripple event cards) connected by red string
- Pushpins in various colors holding the clippings
- Scattered sticky notes with conspiracy phrases ("WHO BENEFITS?", "FOLLOW THE $", "COINCIDENCE?", "CLASSIFIED", "REDACTED")
- Coffee stain rings
- Torn newspaper scraps
- Tape strips holding some clippings at angles
- Each clipping is slightly rotated, like someone pinned it hastily at 3am

The cards are NOT visible initially. They're there but very faint (opacity ~0.08). The board looks like a wall of chaos you can't quite make out yet.

### Phase 3: The Play Experience
When the user hits Play:
1. **Music starts** — noir jazz at low volume (0.15). Smoky bar atmosphere.
2. **A glowing light appears** on the first red string connection point. This is the "camera" — it's a soft warm spotlight that illuminates a radius around it. Think: a detective's desk lamp pointed at the board.
3. **The camera slides to Node 1.** The board pans so Node 1 is centered. As the light reaches the node, the clipping card fades to full opacity. The pushpin catches the light.
4. **SFX plays** — a domain-appropriate sound effect (oil drilling rumble for commodities, stock ticker for finance, etc.)
5. **ReddX character slides in** from the right side of the screen. Large (55% of viewport height). The character is a PNGTuber with multiple poses. Pose is chosen by severity:
   - Question pose for the first ripple
   - Plotting for severity 4
   - Shocked for severity 5 or the last ripple (comedic punchline)
   - Informative for severity 3
   - Cig for severity 2 (casual, noir energy)
   - Shrugging for severity 1
6. **Narration plays** — ReddX's voice clone narrates this specific ripple. 2-3 sentences. The music ducks to 0.08 volume during narration. The narration is NOT a formal analysis. It's a funny friend explaining something crazy. Gets more incredulous as the chain progresses.
7. **Narration ends** → music comes back up to 0.2 → ReddX slides out
8. **After a 1.2 second pause**, the glowing light starts traveling along the red string to the next node. The camera (viewport) follows. During this 2.5 second transition, the user sees the junk between nodes — sticky notes, coffee stains, scraps — briefly illuminated as the light passes over them. Music swells slightly to 0.25.
9. **Light arrives at Node 2.** The next clipping fades in. SFX plays. ReddX slides in with a new pose. Narration plays. Repeat.
10. **Final node** — the comedic punchline. This is always something absurdly mundane (your burrito costs $3 more, your Amazon package is 2 days late). ReddX appears in the "shocked" pose and the narration is disproportionately upset about this tiny consequence while barely acknowledging the catastrophe that caused it.
11. **After the last narration**, ReddX slides out. Music fades out over ~3 seconds. The light dims. Board stays visible for the user to explore.

### Phase 4: Post-Play Exploration
After the guided experience completes, the user can:
- Manually scroll/pan the corkboard left and right to review nodes
- Click on any clipping to see details and source links
- Hit Play again to replay the full experience

## TECHNICAL STACK

- **Frontend:** React + Vite, deployed to Netlify
- **Corkboard:** CSS transforms for horizontal panning, SVG for red string paths, CSS for cork texture/grain
- **Audio:** HTML5 Audio elements. Per-ripple narration files (narration-1.mp3 through narration-N.mp3), one music.mp3, per-ripple sfx-N.mp3. All pre-cached in /public/cache/{eventId}/
- **ReddX Character:** PNG sprites at /public/reddx/{pose}.png. Has blink variants ({pose}-blink.png). Slide in/out via CSS transform transition.
- **Playback:** Event-driven via narration.onended, NOT timer-based. This ensures timing adapts to actual narration length.
- **Light/spotlight:** CSS radial gradient overlay that follows the camera position. Illuminates a radius around the current focus point.
- **Folder open animation:** CSS/Framer Motion transition. Manila folder → unfold → expand → dissolve into corkboard.

## AUDIO VOLUMES
- Music: 0.15 (default) → 0.08 (during narration) → 0.2 (post-narration) → 0.25 (during transitions)
- SFX: 0.3
- Narration: 0.9
- Music loops. It's 4 minutes of noir jazz.

## FILES STRUCTURE
```
public/
  cache/{eventId}/
    analysis.json          — ripple chain + metadata from Claude
    narration-scripts.json — the text scripts (for reference)
    narration-1.mp3        — per-ripple TTS narration
    narration-2.mp3
    ...
    music.mp3              — 4 min noir jazz
    sfx-1.mp3              — per-ripple sound effects
    sfx-2.mp3
    ...
  reddx/
    informative.png / informative-blink.png
    Plotting.png
    shocked.png
    cig.png / cig-blink.png
    Question.png / Question-blink.png
    shrugging.png / shrugging-blink.png
    base.png / base-blink.png
    big brain time.png / big brain time-blink.png
    Deal_with_it.png
    gossip.png
    Source.png / Source-blink.png
```

## PERSONALITY
The narrator is NOT a detective. NOT formal. NOT "noir" in the pretentious sense. 

Think: a YouTube creator who went down a Wikipedia rabbit hole at 3am and is now breathlessly explaining to you how closing a shipping lane in Iran somehow makes your Chipotle order cost more. He finds the interconnectedness genuinely hilarious and slightly terrifying. Gets progressively more incredulous. The last ripple is always the punchline — the narrator gets LIVID about a trivial personal consequence while barely acknowledging the global catastrophe.

The MUSIC is noir jazz. The PERSONALITY is absurdist YouTube energy. The contrast is the brand.

## KEY AESTHETIC DETAILS
- Cork board texture: CSS noise/turbulence filter overlay, warm brown gradient
- Paper clippings: cream/off-white (#e8dcc8), slightly yellowed
- Red string: #c23030 with subtle glow (drop-shadow)
- Pushpins: varied colors with white highlight dot for 3D effect  
- Sticky notes: various pastels (yellow, blue, pink, green)
- Handwriting font: Caveat (Google Fonts)
- Typewriter font: Special Elite (Google Fonts)
- Coffee stains: circular border rings in brown, very subtle
- Tape strips: semi-transparent yellow
- Vignette: dark edges on all four sides to focus attention on center
- Frame: thin dark border top and bottom simulating a physical board frame

## WHAT SUCCESS LOOKS LIKE
When someone watches the demo video of this product, they should:
1. Immediately understand what it does (event → consequences visualized)
2. Laugh at least once (the punchline narration)
3. Think "I want to try other events" (the carousel invites exploration)
4. Remember the aesthetic (cork board + red string + jazz = unique)
5. Hear the quality of the voice clone and music (ElevenLabs showcase)
6. Understand that Turbopuffer is doing semantic matching of historical event parallels (not just Claude guessing)
