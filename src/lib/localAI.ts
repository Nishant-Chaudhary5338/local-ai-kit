import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

// OpenAI-shaped facade over WebLLM. The "3-line diff" story: same
// `client.chat.completions.create({ messages, stream })` shape as the OpenAI
// SDK, but the model runs on-device. Model selection happens via load() /
// engine.reload — not the request `model` param (which WebLLM ignores).
//
// The WebLLM engine is dynamically imported inside load(), so it is code-split
// out of the initial bundle and only downloaded when a user loads a model.

export type LoadProgress = (report: { text: string; progress: number }) => void;

export class LocalAI {
  private engine: MLCEngineInterface | null = null;

  async load(modelId: string, onProgress?: LoadProgress): Promise<void> {
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (r: InitProgressReport) =>
        onProgress?.({ text: r.text, progress: r.progress }),
    });
  }

  get ready(): boolean {
    return this.engine !== null;
  }

  // Aborts the current streamed generation, if any.
  interrupt(): void {
    this.engine?.interruptGenerate();
  }

  // Delegates to the WebLLM engine, which exposes the OpenAI-compatible surface
  // (chat.completions.create with streaming + JSON mode).
  get chat(): MLCEngineInterface["chat"] {
    if (!this.engine) throw new Error("LocalAI: call load() before chat");
    return this.engine.chat;
  }

  async unload(): Promise<void> {
    await this.engine?.unload();
    this.engine = null;
  }
}
