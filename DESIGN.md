---
schema_version: 1
product: "aura-music"
audience: "Music enthusiasts, audiophiles, and daily listeners seeking a high-fidelity, cinematic streaming experience"
primary_task: "Discover, stream, and curate high-fidelity music with studio EQ, real-time lyrics, smart queuing, and collaborative listening"
mode: "redesign"

facts:
  - "Built with React 19, TypeScript, Tailwind CSS, TanStack Query, and Zustand"
  - "Features real-time audio playback, 10-band studio equalizer, synced lyrics, and offline caching"
  - "Runs across desktop, tablet, and mobile viewports"

preserve:
  - "Core audio engine architecture, volume controls, and playback state machine"
  - "Firebase auth integration, Jam session WebSockets, and offline LocalStorage persistence"
  - "Studio EQ presets and 10-band frequency mapping"
  - "Existing routing/tabs: explore, charts, podcasts, library"

direction:
  summary: "Acoustic Nocturne: High-Fidelity Studio Soundstage"
  rationale: "Music streaming demands an atmospheric, focused dark environment where album artwork and audio controls take center stage. Replacing generic grey cards with physical music artifacts (vinyl grooves, cassette cases, acoustic waveforms) elevates Aura into a premium audiophile workstation."

change_contract:
  composition:
    before: "Generic 3-column card grid, flat rectangular hero box, uniform spacing across all sections"
    after: "Curated soundstage hierarchy: cinematic vinyl spotlight hero with ambient acoustic glow, asymmetric discovery modules, tactile genre dials, and clear distinction between tracks, artists, and playlists"
  typography:
    before: "Standard sans-serif with uniform sizing and weak hierarchy"
    after: "Space Grotesk for technical/display headings, Plus Jakarta Sans for refined body and controls, tabular numerals for durations, bitrates, and timestamps"
  color_roles:
    before: "Single indigo accent scattered across arbitrary borders and backgrounds"
    after: "Strict semantic tokens: Deep Obsidian surface canvas (#08090E), Raised Carbon panels (#0F121C), Luminous Action Indigo (#6366F1), Electric Cyan status (#06B6D4), and AAA-tested high-contrast text (#EDF3FC, #A9BACF)"
  cards:
    before: "Identical grey boxes with generic thumbnail and plain border-white/10"
    after: "Architectural vinyl-grooved song cards with live audio equalizer indicators, circular concentric wave artist portraits, and glossy jewel-case playlist sleeves"
  loading_animations:
    before: "Generic pulsating gray boxes and basic spinners"
    after: "Audio-engineered loaders: 5-bar harmonic equalizer wave, 33-RPM rotating vinyl groove disc, and frequency-shimmer skeletons"
  signature_detail:
    before: "Flat static text tags"
    after: "Live playing equalizer wave indicator on active track cards, interactive vinyl sleeve slip hover, and integrated waveform scrub bar in player dock"

token_source: "src/index.css"
responsive_rules:
  - "320px–480px: Single-column reflow, full-width touch cards, 44px minimum mobile tap targets, fixed bottom tab bar with safe area padding"
  - "481px–768px: 2-column track grid with compact metadata"
  - "769px–1280px: 3-column balanced soundstage with desktop top navigation and docked player capsule"
  - "1281px+: Max-width 7xl containment with high-density studio details"

required_states:
  - "Default: Clean architectural hierarchy with subtle tactile borders"
  - "Hover: Dimensional elevation, vinyl sleeve slippage, radiant play button appearance"
  - "Active/Playing: Living audio wave pulse, glowing ambient aura, neon accent indicators"
  - "Loading: 5-bar acoustic frequency equalizer animation and vinyl spinner"
  - "Empty: Curated vinyl turntable illustration with action recovery buttons"
  - "Offline: Amber studio telemetry banner with one-click cache toggle"

references:
  - "Design with Intent (DWI) v1.2.0: Art Direction, Visual System, Premium Craft, Motion Profiles"
  - "WCAG 2.2 AA Contrast & Touch Target Standards"

rejected_options:
  - option: "Light mode theme or stark white backgrounds"
    why: "Destroys cinematic ambiance essential for music listening and causes severe eye fatigue during nighttime audio sessions"
  - option: "Flat minimalism without depth or texture"
    why: "Makes modern web music apps feel like generic spreadsheet tools; physical audio cues (vinyl, tape, soundwaves) are essential to music culture"

verification:
  performed:
    - "Checked primary text contrast: #EDF3FC on #0A0C14 yields 17.5:1 (Passes WCAG AAA)"
    - "Checked action contrast: #A8DBF8 on #0A0C14 yields 13.16:1 (Passes WCAG AAA)"
    - "Checked button contrast: #FFFFFF on #4F46E5 yields 6.29:1 (Passes WCAG AA)"
    - "Checked minimum touch target sizes: 44px x 44px passes mobile standards"
    - "TypeScript lint checks passing: 0 errors"
  not_performed:
    - "Playwright end-to-end automated multi-device screenshots (Playwright browser binary not pre-installed in workspace)"
---

# Aura Music — Design Decisions & Architecture

## Core Philosophy: The Acoustic Nocturne
Aura is engineered as a high-fidelity listening sanctuary. Every component reflects genuine audio engineering principles:
1. **Physicality**: Cards reflect vinyl records, cassette cases, and rackmount studio gear rather than generic web cards.
2. **Motion with Intent**: All transitions use DWI expressive cubic-bezier curves (`0.22, 1, 0.36, 1`) with full reduced-motion overrides.
3. **Audio-First Feedback**: Live equalizer waveforms animate on active playing songs, letting users visually feel the audio pulse.
