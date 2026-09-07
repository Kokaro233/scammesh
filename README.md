# ScamMesh

ScamMesh is a hackathon prototype for cross-channel scam detection. Six agents watch separate mock channels at the same time — call, message, browser, device, identity, and payment — and share structured risk events through a Mozaik runtime. Each channel alone provides only partial evidence, so the agents correlate those events while they are still running.

*No single agent sees the scam. Mozaik lets them see it together.*

ScamMesh never executes, freezes, or blocks a real financial transaction. Pause transfer in the UI is a demo recommendation only.

**ScamMesh runs in deterministic mock mode by default.** The channel feeds and inference outputs are mocked so the demo is repeatable and requires no external credentials. The Mozaik runtime itself is not mocked: all six agents join the same session, run concurrently, publish semantic events, update shared runtime state, and adapt to events produced by other agents. The scheduler only injects feeds — it does not invent the final risk score.

A live inference path is also implemented through an OpenAI-compatible `/chat/completions` adapter. Set `MOCK_INFERENCE_MODE=false` and provide `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL` to enable it. Live and mock inference return the same structured analysis schema and continue through the same Mozaik event, adaptation, risk, SSE, and UI pipeline.

The submitted demo intentionally uses mock inference for reproducibility. The live provider path is implemented but has not been validated end-to-end with production credentials as part of this hackathon build.

## Demo

![Demo screenshot](docs/demo-placeholder.svg)

TODO: replace `docs/demo-placeholder.svg` with a short recording of Apex Bank impersonation.

After the commands in [Run locally](#run-locally), open http://127.0.0.1:5173 and start Apex Bank impersonation. The app pages are Overview, Live Detection, Risk Signals, Transfer Check, and History.

## What ScamMesh does

Each agent receives only the mock input for its own channel and publishes typed detections such as `coercion_detected` or `suspicious_link_detected`. Agents do not read another agent’s raw transcript, inbox, page, telemetry, or payment draft. When one agent publishes an event, another agent can raise its check mode (NORMAL → HEIGHTENED → PRIORITY) and re-inspect the input it already has.

A deterministic risk engine fuses those events into a 0–100 demo-rule score (LOW / WATCH / HIGH / CRITICAL). There is no boss or judge agent, and the score is not a fraud probability. If events from enough channels involve a payment draft, the UI can recommend pausing the transfer. It does not send or stop a real payment.

There are three replayable scenarios: `bank-impersonation` (the main story), `benign-bank` (an official RM 300 transfer that should stay below CRITICAL), and `ambiguous` (an unknown caller plus ordinary official activity).

## Demo scenario

The main demo is Apex Bank impersonation (`bank-impersonation`). A caller claims to be Apex Bank Anti-Fraud Centre, reports unusual account activity, and tells the user not to hang up. The same call uses money-laundering language and says not to tell family.

While the call is still open, an SMS from `+60119000000` links to `https://secure-bank-verify.example/login`. The caller tells the user to open it and enter a card number and OTP on a page that presents itself as Apex verification. Zoom screen sharing starts, AnyDesk opens, and a DuitNow draft appears: RM 8,000 to a new beneficiary, Apex Safe Holding (`9901882233`), marked irreversible.

Each of those facts is incomplete on its own. A tense call, a verification SMS, a bank-branded form, screen sharing, and a new payee can all look ordinary. Together they share the same unofficial number, clone domain, remote-access apps, and “safe holding” account.

ScamMesh starts the six agents in one session. Call watches the transcript, Message the SMS, Browser the page, Device the telemetry, Identity a local Apex registry, and Payment Agent the draft. Call `coercion_detected` can move Message to HEIGHTENED on that same SMS (`suspicious_link_detected`). Browser then goes PRIORITY for credential harvesting. Device `remote_control_detected` and Identity’s unknown-payee result raise Payment Agent to PRIORITY on the RM 8,000 draft.

## Why multi-agent

The six inputs are different data types with different boundaries: a call transcript is not a DOM, and a DuitNow draft is not a phone number. The agents are separated by data boundary, not by persona. Call cannot read the browser page or the payment draft, Browser cannot read the call transcript, and Payment Agent cannot read either of those raw inputs. In this demo, each agent is given only the mock payload it needs for its channel.

The attack is also concurrent. The SMS does not wait for call analysis to finish, and the payment draft does not wait for the browser report. A fixed Call → Message → Browser → Payment pipeline would miss that overlap. Adaptation happens during the session: Message re-checks the same SMS after Call publishes `coercion_detected`, rather than waiting for a final merge step.

## Why Mozaik

Mozaik is the collaboration runtime. It does not classify scams. The official ideas map to this repo as follows.

| Mozaik idea | In this codebase |
| ----------- | ---------------- |
| Concurrency | Six `createAgent` participants start together. There is no fixed handoff order. |
| Awareness   | Agents observe structured semantic events. They do not share raw channel payloads. |
| Adaptivity  | A situation handler can change another agent’s check mode while that agent’s loop is still open. |

## Architecture

```
mock feeds (call / SMS / page / device / registry / payment)
                    |
                    v
         Mozaik session (defineRuntime)
  Call  Message  Browser  Device  Identity  Payment
                    |
                    v
            semantic events
                    |
                    v
    deterministic risk engine -> Live Detection UI
```

More detail is in [docs/architecture.md](docs/architecture.md).

| Agent    | Input in the demo              | Does not do                         |
| -------- | ------------------------------ | ----------------------------------- |
| Call     | call transcript                | judge a domain or payee             |
| Message  | SMS / inbox                    | read the call or payment draft      |
| Browser  | page URL, text, form fields    | start or stop a payment             |
| Device   | device telemetry               | read the phone call                 |
| Identity | local trusted registry         | act as a final judge                |
| Payment  | payment draft                  | execute, freeze, or block money     |

Payment Agent is implemented in code as `createTransactionAgent`. The UI and this README use Payment.

## How Mozaik is used

The project uses official `@mozaik-ai/core` 4.0.5: `defineRuntime` plus `initializeRuntime` once per session.

- Each live simulation creates its own `defineRuntime<ScamRuntimeState>()` closure.
- Six agents plus Starter, Feeder, and Observer humans `join` the same session.
- Channel input is `sendEvent(SemanticEvent.create(...), feeder.getId())`. `senderId` must be the joined participant UUID, not a nickname such as `"call"`.
- Each agent `runLoop` is fire-and-forget. Situation processors do not `await` other agents.
- Situation handlers watch semantic events and update `agentModes` (NORMAL → HEIGHTENED → PRIORITY) while loops are still open.
- Shared `RuntimeState` stores events, entities, adaptations, and risk snapshots, not full private payloads.
- The browser does not own the runtime. Express hosts the session. The UI starts, pauses, resets, and listens on SSE.

## Run locally

Node 18+ is required. There is no Docker, database, or login.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell: `Copy-Item .env.example .env`

- UI: http://127.0.0.1:5173
- Health: http://127.0.0.1:3001/health

Keep `MOCK_INFERENCE_MODE=true` and leave every `LLM_*` field empty.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## API configuration

Secrets are not stored in git. `.env.example` is empty on purpose:

```
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=
MOCK_INFERENCE_MODE=true
```

| Field                  | Meaning |
| ---------------------- | ------- |
| `LLM_PROVIDER`         | OpenAI-compatible provider label for the live adapter |
| `LLM_API_KEY`          | Leave empty for the submitted demo. Never commit a real key. |
| `LLM_MODEL`            | Model id used when live inference is enabled |
| `LLM_BASE_URL`         | Base URL for `/chat/completions` (required for live mode) |
| `MOCK_INFERENCE_MODE`  | Default `true` keeps deterministic mock inference. Set `false` only with the four `LLM_*` fields filled. Missing config, HTTP errors, or invalid responses fall back to mock so the UI keeps rendering. |

Do not set a real `MOZAIK_API_KEY` for this prototype. Core may log that cloud telemetry is disabled. That is expected.

Simulation routes:

- `POST /api/simulation/start` with `{ scenarioId, speed, identityDelay }`
- `POST /api/simulation/pause`
- `POST /api/simulation/resume`
- `POST /api/simulation/reset`
- `GET /api/simulation/state`
- `GET /api/events` (SSE)
- `GET /api/scenarios`
- `GET /api/system/status`

`scenarioId` values: `bank-impersonation`, `benign-bank`, `ambiguous`.

## Current scope and limitations

Built in this repo:

- Six concurrent Mozaik agents and four documented adaptations
- Deterministic risk fusion and three replayable mock scenarios
- UI pages: Overview, Live Detection, Risk Signals, Transfer Check, History
- Tests for reset, scenario repeatability, and LLM fallback

Mocked, not integrated:

- Phone, SMS, WhatsApp, email, browser, device, and bank connectors
- Trusted registry data (local Apex allowlist)
- Live LLM completions in the submitted demo path (mock inference is the default)

Live in this build:

- Official Mozaik session, six concurrent agents, and the four documented adaptations
- Deterministic risk fusion from those live events
- SSE + `/api/simulation/state` as the UI source of truth
- OpenAI-compatible live inference adapter with the same analysis schema and fallback to mock

Not implemented and not claimed:

- Real payment execution, freeze, or block
- Login, database, Docker, OAuth, or production authentication
- A boss / judge agent or a real fraud probability
- End-to-end validation of live inference against production API credentials
- Production-grade privacy isolation beyond the demo rule that each agent only receives its own channel input

Possible later integrations (not in this build):

- Replace mock feeds with bank, telco, or MDM connectors that still emit the same event schema
- Selective live inference (for example Call / Message / Browser only) while Device, Identity, and Payment stay rule-based

## Tech stack

TypeScript, `@mozaik-ai/core` 4.0.5, Express, Vite, React, Vitest. Built for the JigJoy × Mozaik Concurrent Agents Hackathon.
