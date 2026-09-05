# ScamMesh

Cross-channel scam defense powered by concurrent agents.

This repository is a **Hackathon prototype**. It performs **no real financial actions**.

Phase 2 uses the official Mozaik v4 runtime from https://github.com/jigjoy-ai/mozaik. Dummy alpha/beta prove concurrent `runLoop`s. Business agents are not implemented yet.

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
