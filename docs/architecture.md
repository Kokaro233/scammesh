# Architecture

ScamMesh is a Mozaik session plus a deterministic fusion layer plus a UI that only watches.

The story the judges should see is in the [README](../README.md): one Tuesday call that is harmless in each channel and obvious across all six.

## Pieces

```text
Feeder human  --semantic feed events-->  six isolated agents
        agents --structured detections-->  shared RuntimeState
        situation handlers --adapt mode / re-check same input-->
        risk engine --score, reasons, correlation edges-->
        Express SSE  -->  Live Defense Room / Evidence / Action
```

| Piece | Responsibility |
| --- | --- |
| Six agents | Call, Message, Browser, Device, Transaction, Identity. Each has one input domain. |
| Shared environment | One `defineRuntime<ScamRuntimeState>()` per session. `initializeRuntime` once. |
| Semantic events | Closed vocabulary in `src/runtime/events.ts`. Agents publish detections, not essays. |
| Risk engine | Base weights + synergy bonuses + 4-channel bonus. Clamp 0–100. LOW / WATCH / HIGH / CRITICAL. |
| UI | Start / pause / reset / SSE. Must not construct the Mozaik runtime. |

## Runtime (official Mozaik v4)

`src/runtime/createScamSession.ts` is the session factory.

- `defineRuntime` + `initializeRuntime` (calling initialize twice on the same closure throws; each live sim gets a new factory).
- `createAgent` × 6, `createHuman` for Starter, Feeder, Observer.
- `join` / `leave(participant)` — leave takes the Participant object.
- `sendMessage` starts the concurrent loops.
- `sendEvent(SemanticEvent.create(type, producerId, payload), senderId)` injects channel mocks. `senderId` must be a joined UUID.
- `runLoop` is fire-and-forget inside situation processors.

Isolated buffers live on `ScamRuntimeState`: transcript, inbox, pages, telemetry, intents, lookups. An agent does not read another buffer.

## Four runtime adaptations

These are situation handlers, not a planned pipeline.

1. Call `coercion_detected` → Message NORMAL→HEIGHTENED, same SMS re-checked.
2. Message `suspicious_link_detected` → Browser PRIORITY, same page re-checked.
3. Device `remote_control_detected` → Transaction HEIGHTENED.
4. Identity `official_identity_mismatch` on the beneficiary → Transaction PRIORITY.

Identity is a registry lookup (`src/scenarios/trustedRegistry.ts`), not a judge.

## Risk fusion

`src/risk/riskEngine.ts` only. No LLM vote.

- Reasons on every snapshot (`+12 coercion detected`, synergy lines, channel-count bonus).
- Correlation edge labels used by the graph: `link opened`, `OTP requested`, `same claimed bank`, `new beneficiary`, `identity mismatch`.
- `cross_channel_pattern_detected` is recorded once when the score is CRITICAL **and** four or more channels fired. It is never baked into scenario JSON.
- CRITICAL + a payment event → recommended actions “Do not transfer” and “Verify through official channel.” Prototype text only.

## Simulation API

`src/server/simulation/controller.ts` owns timers and one live session.

- Start schedules feeds at `timestampOffsetMs / speed` (the UI uses speed `2`).
- Reset `dispose()`s the runtime and drops SSE listeners.
- Three scenarios: `bank-impersonation`, `benign-bank`, `ambiguous`.

## Inference

`src/inference/*`. Mock is mode-aware (the SMS link is quiet in NORMAL, loud in HEIGHTENED). Empty `LLM_*` or `MOCK_INFERENCE_MODE=true` uses mock. A configured provider that throws still returns mock JSON so the room does not crash.
