# ScamMesh UI / Frontend Master Specification

This file is the frontend source of truth for visual language, pages, demo choreography, and shared state. Do not reinvent the product, the six channels, or the visual system.

Phase order is mandatory. Finish one phase, build, then stop unless asked to continue.

## 0. Scope

Frontend owns: UI/UX, visual implementation, interaction, motion, demo playback, cross-page state, and frontend quality.

Do not:

- redesign product logic
- invent a new visual style
- change the six agent / channel duties
- add extra product modules
- add decorative AI, charts, or animation without a job

Visual assets already in `src/assets/`:

- `ui-preview.png` — highest-priority visual reference. Recreate with components. Never show as a page or full background.
- `risk-stamp.png` — final High Risk judgment only
- `signal-slip.png` — one reusable `<SignalSlip />`
- `transfer-receipt.png` — receipt surface; all text is HTML
- `paper-texture.png` — sparse accent, empty states, secondary paper

## 1. Product

**ScamMesh** is a real-time cross-channel scam detection system.

Channels (UI language, not “AI agents”):

- Calls
- Messages
- Browser
- Device
- Identity
- Payments

Story: scams span channels. ScamMesh connects scattered signals into one pattern.

Visual story: **scattered → connected → complete pattern**.

## 2. Design direction

Modern Financial Documents × Real-time Security Monitoring × Consumer Safety.

Quiet until danger. Professional, mature, financial, restrained, dense enough to feel shipped.

## 3. Forbidden visual language

No purple/blue neon, glassmorphism, AI glow, robot/brain/sparkle icons, “Powered by AI”, giant risk gauges, bento KPI walls, shadcn-default card grids, vintage newspaper, coffee stains, or stamps everywhere.

## 4–5. Tokens

Use `src/ui/styles/tokens.css`.

Red is semantic only: detected risk, suspicious relationships, transfer warning, high risk, stop/pause.

Sans (Inter) for UI. Serif (DM Serif Display) only for ScamMesh and rare titles. Mono only for IDs, URLs, timestamps, account numbers.

## 6. Asset rules

- Preview = layout, hierarchy, paper + digital mix, sidebar, quiet-to-risk language
- Receipt image = structure only; amount, name, bank, status are live HTML
- One SignalSlip component for all six channels
- Red stamp only on final High Risk (Live Detection and Transfer Check, once each)
- Paper texture is not a site-wide wallpaper

## 7. Navigation

Desktop left sidebar:

```
ScamMesh
Overview
Live Detection
Risk Signals
Transfer Check
History
────────
Settings
```

No Agent Hub / AI Center pages. App header is small: page name left; date / status / optional bell / avatar right. No marketing landing page. First screen is Overview.

## 8–22. Pages (later phases)

- **Overview** — quiet metrics strip, 7-day activity, recent table
- **Live Detection** — primary demo stage: receipt + six slips + SVG mesh + risk panel
- **Risk Signals** — filterable table + slip drawer
- **Transfer Check** — receipt + judgment + pause
- **History** — financial table + drawer
- **Settings** — preferences only

## 23–26. Motion

Page change: 150–220ms opacity + 2–4px translateY.

Only animate: new signal, new connection, risk state change, pause transfer.

No floating cards, pulses, particles, glowing lines, or infinite motion.

## 27–32. Demo

Deterministic mock pipeline, same UI state as live mode.

Controls: Run demo / Pause / Replay / Reset.

Timeline ~35–45s (Fast ~20–25s). Pause freezes timers and progression. Reset returns score 18 / Normal / no stamp / no demo history row.

## 33–35. States

Agent work: Monitoring / Checking / Verifying. One delayed agent must not block others. Judgments stay uncertain until connections confirm the pattern.

## 36–41. Craft

Lucide icons. Narrow quiet sidebar; active item `#F3E4E1` + muted red text. Desktop first (1440+). SVG mesh. Compress paper assets.

## 42–47. Architecture

Suggested later:

```
src/ui/components/{layout,signals,transfer,risk,mesh,coordination,activity,demo}
src/ui/pages/*
src/ui/store/scamStore
src/ui/demo/{scenario,choreography}
src/assets
```

Shared store: riskScore, riskLevel, signals, connections, channelStates, transfer, history, overviewStats, demoStatus, coordinationEvents.

Do not let the UI invent scores.

## 48–54. Copy and quality

Plain language. Product name is ScamMesh, not Mozaik Demo. Coordination lives in a folded System activity panel.

Magical moment is mesh formation, not a giant 94.

No network required for demo (`DEMO_MODE` / mock scenario).

## 55. UI phases

| Phase | Work |
| --- | --- |
| 0 | Inventory assets. No pages. |
| 1 | Design tokens |
| 2 | AppShell, Sidebar, Header |
| 3 | SignalSlip |
| 4 | TransferReceipt |
| 5 | Overview |
| 6 | Live Detection static layout |
| 7 | SVG Signal Mesh |
| 8 | Risk Assessment + stamp |
| 9 | Demo choreography |
| 10 | Coordination panel |
| 11 | Risk Signals |
| 12 | Transfer Check |
| 13 | History |
| 14 | Shared store |
| 15 | Pause transfer loop |
| 16 | Loading / Delayed |
| 17 | Motion polish |
| 18 | Responsive |
| 19 | Pixel polish vs preview |

After each phase: `npm run build`, then stop unless asked to continue.

## 58. Definition of done

High-fidelity recreation, live HTML data, shared state, deterministic demo, pause-transfer loop, no AI-template look, quiet until danger, build clean.

## 59. Principles

**Quiet until danger.**

**Scams happen across channels. ScamMesh connects the signals.**
