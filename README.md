# ScamMesh

Cross-channel scam defense powered by concurrent agents.

This repository is a **Hackathon prototype**. It performs **no real financial actions**.

Phase 11 adds Evidence and Action pages. Evidence traces who produced each event and who used it. Action only recommends human checks. Restart Demo replays the same scenario. Keep `MOCK_INFERENCE_MODE=true`.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

- UI placeholder: http://127.0.0.1:5173
- Server health: http://127.0.0.1:3001/health

Leave `LLM_*` empty. Keep `MOCK_INFERENCE_MODE=true` until a provider is added later.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
