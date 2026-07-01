# local-ai-kit

Browser-native, fully-private AI — LLM inference runs 100% client-side via
[WebLLM](https://github.com/mlc-ai/web-llm) + WebGPU. No backend, no API keys,
no data leaving the device.

> **Phase 0 spike.** De-risks the core assumption: does WebGPU inference actually
> perform on real hardware? Loads a model in a Web Worker, streams one message,
> reports prefill/decode tokens-per-second.

## Run

```bash
pnpm install
pnpm dev
```

Open the printed URL in **Chrome/Edge 113+**, **Safari 26+**, or **Firefox 141+
(Windows)**. Pick a model → **Load model** (first load downloads weights, then
they're cached) → type a prompt → **Send**.

## What to look for

- WebGPU badge = `available`
- Model loads to `ready` with live progress
- Response streams token-by-token
- tok/s footer shows real prefill + decode speed on *your* GPU

Those numbers decide the default model tier for the real app.

## Testing

```bash
pnpm test:e2e
```

Two tiers (`tests/e2e/`):

- **Tier 1 — deterministic UI + fallback** (always runs, CI-safe): header, capability
  badge resolution, the no-WebGPU fallback path, model picker, disabled states,
  console-error check.
- **Tier 2 — real inference smoke** (`inference.spec.ts`): self-**skips** unless the
  browser exposes a working WebGPU adapter. Chromium exposes none under automation,
  so it skips in CI. To run it for real, point Playwright at a WebGPU-capable
  browser; it loads a small model, streams a reply, and asserts decode tok/s > 0.

> Note: `navigator.gpu` can exist while yielding **no usable adapter** (e.g. under
> automation). Capability detection therefore calls `requestAdapter()` — presence
> of `navigator.gpu` alone is not enough. (Caught by the Tier 1 fallback test.)

## Roadmap

Full plan (Vault app: private journal + local RAG, Trust Panel, offline PWA) and
the extractable-package strategy live in project memory.
