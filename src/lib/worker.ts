import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// The worker hosts the actual WebLLM engine. All GPU/inference work happens
// here, off the main thread, so the UI stays responsive during generation.
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent): void => {
  handler.onmessage(msg);
};
