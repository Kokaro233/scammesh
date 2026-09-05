# ScamMesh

**Cross-channel scam defense powered by concurrent agents.**

*No single agent sees the scam. Mozaik lets them see it together.*

*Scams cross channels. Protection should too.*

This repository is a **hackathon prototype**. It performs **no real financial actions**. Every phone call, SMS, page, device event, and transfer below is a **deterministic mock feed**. The product is not “one AI that decides if this is a scam.” It is six least-privilege guards that only share structured risk events, then adapt while they are still running.

![Demo screenshot / GIF placeholder](docs/demo-placeholder.svg)

*Replace `docs/demo-placeholder.svg` with a 90–120s recording of **Apex Bank impersonation** after the UI pass. Until then: `npm run dev` → open http://127.0.0.1:5173 → start that scenario.*

---

## The Tuesday call

The phone rings at 2:17 p.m.

“This is Apex Bank Anti-Fraud Centre. We detected unusual activity on your account.”

The number looks almost official. The voice is calm, then tight. A money-laundering case. **Do not hang up.** Stay on the line or the account will be frozen. Do not tell family. This is confidential.

Twelve seconds later an SMS arrives from the same number:

> Apex Bank: Verify your account immediately: `https://secure-bank-verify.example/login`

The caller is still on the line. “Open the SMS now. Enter your card number and the OTP so we can lock the account.”

The page wears the Apex logo. It asks for a debit card and a one-time password. Zoom starts sharing the screen. Then AnyDesk opens. Then a DuitNow draft appears: **RM 8,000**, new beneficiary, **Apex Safe Holding**, account `9901882233`, not reversible.

None of those facts is a conviction by itself.

- A tense call could be a real fraud desk.
- A verify-your-account SMS is a Tuesday.
- A login form is what banks look like.
- Screen share is how IT helps.
- A new payee happens when you pay a contractor.

The scam is the **timing**. The same voice, the same fake number, the clone domain, the remote-control app, and the “safe holding” account arrive as one story. A single-channel filter sees a fragment and stays polite. The money moves in the gap.

That gap is the product.

ScamMesh starts six isolated agents at the same moment. Call only hears the transcript. Message only sees the SMS. Browser only sees the page. Device only sees telemetry. Transaction only sees the draft. Identity only checks a local Apex registry. No agent reads another agent’s raw channel.

When Call publishes `coercion_detected`, Message — still looping on that same SMS — switches NORMAL → HEIGHTENED and the link becomes `suspicious_link_detected`. Browser then goes PRIORITY and the Apex-looking form becomes credential harvesting. Device publishes `remote_control_detected` and Transaction tightens on the RM 8,000 draft. Identity says the “safe account” is not a known payee, and Transaction goes PRIORITY.

A deterministic risk engine, not a boss agent, fuses those events. Demo-rule score, not a probability. When the chain is wide enough it recommends **pause and verify** — it never blocks or sends a payment.

Two other mocks exist so the story can fail closed: **Official Apex Bank transfer** (RM 300 to a known payee) must not go CRITICAL, and **Unknown caller plus official banking** stays incomplete on purpose.

---

## The problem

Scams are already concurrent. Protection usually is not.

The caller does not wait for the SMS classifier to finish. The clone page does not wait for the call to end. The transfer draft does not wait for the browser report. Isolated tools each hold a weak signal and decline to shout. Users lose money in that silence.

ScamMesh’s claim is narrow: **if the channels are isolated, the runtime must not be.**

## Why Mozaik

Mozaik is the collaboration runtime, not the scam classifier.

| Official idea | What judges should see |
| --- | --- |
| **Concurrency** | Six `createAgent` participants start together. There is no Call → Message → Browser pipeline. |
| **Awareness** | Agents subscribe to structured semantic events. They never share raw transcripts, SMS bodies, or card fields. |
| **Adaptivity** | A live agent changes check mode because another agent published an event *during* the same session. |

That is why this is a multi-agent system instead of one prompt with six labels.

## Architecture

```text
 mock feeds (call / SMS / page / device / transfer / registry)
                         │
                         ▼
              Mozaik session (defineRuntime)
     ┌────────┬────────┬────────┬────────┬────────┬────────┐
     │  Call  │Message │Browser │ Device │  Txn   │Identity│
     └────┬───┴────┬───┴────┬───┴────┬───┴────┬───┴────┬───┘
          │        │        │        │        │        │
          └────────┴────────┴── semantic events ───────┘
                         │
                         ▼
           deterministic risk engine  →  Live Defense Room
```

More detail: [docs/architecture.md](docs/architecture.md).

| Agent | Sees | Must not do |
| --- | --- | --- |
| Call | transcript only | judge a domain or a payee |
| Message | inbox only | read the call or the transfer |
| Browser | page only | start or block a payment |
| Device | telemetry only | read the phone call |
| Transaction | draft only | execute or freeze money |
| Identity | local registry only | act as a final judge |

## Why multi-agent

1. **Different data domains.** A transcript is not a DOM. A DuitNow draft is not a phone number.
2. **Least privilege.** Sharing raw channels would be a privacy product, not a collaboration product.
3. **The attack is simultaneous.** Six sequential functions would miss the overlap the scam depends on.
4. **Collaboration is runtime, not a merge step.** Message re-checks the *same* SMS after Call shouts. That is the demo.

## How Mozaik is used

Official `@mozaik-ai/core` **v4** (`defineRuntime` + `initializeRuntime` once per session).

- Each session is its own `defineRuntime<ScamRuntimeState>()` closure.
- Six agents plus Starter / Feeder / Observer humans `join` the same session.
- Channel input is `sendEvent(SemanticEvent.create(...), feeder.getId())` — `senderId` is the joined participant UUID, never a nickname like `"call"`.
- Each agent `runLoop` is fire-and-forget. Processors do not `await` other agents.
- Situation handlers watch semantic events and change `agentModes` (NORMAL → HEIGHTENED → PRIORITY) while loops are still open.
- Shared `RuntimeState` holds events, entities, adaptations, and risk snapshots — not full private payloads.
- The browser does **not** own the runtime. Express hosts the session. The UI only starts, pauses, resets, and listens on SSE.

## Run locally

Needs **Node 18+**. No Docker. No database. No login.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell: `Copy-Item .env.example .env`

- UI: http://127.0.0.1:5173
- API / health: http://127.0.0.1:3001/health

Keep `MOCK_INFERENCE_MODE=true`. Leave every `LLM_*` field empty. The Tuesday story plays from mock feeds.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## API configuration

All secrets stay out of git. `.env.example` is empty on purpose:

```
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=
MOCK_INFERENCE_MODE=true
```

| Field | What it is |
| --- | --- |
| `LLM_PROVIDER` | Placeholder name for a later OpenAI-compatible adapter |
| `LLM_API_KEY` | **Never commit a real key.** Empty → mock |
| `LLM_MODEL` | Placeholder model id |
| `LLM_BASE_URL` | Placeholder base URL |
| `MOCK_INFERENCE_MODE` | `true` (default) uses the deterministic mock. Missing or invalid LLM config also falls back to mock. A provider HTTP error does the same. The UI must keep rendering. |

Do not set a real `MOZAIK_API_KEY` for this prototype. Core may log that cloud telemetry is disabled. That is expected.

Useful routes: `POST /api/simulation/start` `{ scenarioId, speed }`, `POST /api/simulation/reset`, `GET /api/simulation/state`, `GET /api/events` (SSE), `GET /api/scenarios`.

`scenarioId`: `bank-impersonation` (the Tuesday call), `benign-bank`, `ambiguous`.

## Limitations & future integrations

**Built now**

- Six concurrent Mozaik agents, four documented adaptations, deterministic fusion, three replayable mock scenarios, Evidence / Action views, tests for reset and LLM fallback.

**Not built, and not claimed**

- No real bank, phone, SMS, WhatsApp, email, browser-extension, or device APIs.
- No payment block, freeze, or send. Transaction only recommends a human pause.
- No login, database, Docker, OAuth, or production auth.
- No Boss / Judge agent. The score is a demo rule, not a fraud probability.
- UI visual polish is a separate track and may still be moving.

**Later, if someone integrates for real**

- Swap mock feeds for bank / telco / MDM connectors behind the same event schema.
- Fill `LLM_*` for a live adapter. The mock path must remain the default for demos.

---

Hackathon build for JigJoy × Mozaik. Stack in this repo: TypeScript, `@mozaik-ai/core` ^4.0.5, Express, Vite, React, Vitest.
