import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";
import type { LoadProgress } from "../lib";

// Loads a small embedding model in its own worker (separate from the chat model,
// so the OpenAI-shaped chat facade stays single-model and untouched). All
// embedding runs on-device via WebGPU — document text never leaves the machine.

export class Embedder {
  private engine: MLCEngineInterface | null = null;
  private modelId = "";

  async load(modelId: string, onProgress?: LoadProgress): Promise<void> {
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
    const worker = new Worker(new URL("../lib/worker.ts", import.meta.url), {
      type: "module",
    });
    this.engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (r: InitProgressReport) =>
        onProgress?.({ text: r.text, progress: r.progress }),
    });
    this.modelId = modelId;
  }

  get ready(): boolean {
    return this.engine !== null;
  }

  async embed(input: string[]): Promise<number[][]> {
    if (!this.engine) throw new Error("Embedder: call load() first");
    const res = await this.engine.embeddings.create({
      model: this.modelId,
      input,
    });
    return res.data.map((d) => d.embedding as number[]);
  }
}
