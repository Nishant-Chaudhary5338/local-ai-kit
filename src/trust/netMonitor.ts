// Network monitor — the evidence layer. Patches fetch/XHR to log every outbound
// request. The honest story it proves: model weights download once (visible
// here), then inference sends ZERO bytes. Install before WebLLM loads so its
// weight fetches are captured.

export type NetEntry = {
  id: string;
  method: string;
  url: string;
  ts: number;
  kind: "model" | "other";
  bytes: number | null;
};

const entries: NetEntry[] = [];
let snapshot: NetEntry[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  snapshot = [...entries];
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): NetEntry[] {
  return snapshot;
}

const MODEL_URL = /huggingface|hf\.co|mlc-ai|raw\.githubusercontent|\.wasm|\.bin|resolve\/main|params_shard/i;

function record(method: string, url: string, bytes: number | null): void {
  entries.push({
    id: crypto.randomUUID(),
    method,
    url,
    ts: Date.now(),
    kind: MODEL_URL.test(url) ? "model" : "other",
    bytes,
  });
  emit();
}

let installed = false;

export function installNetMonitor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    const res = await originalFetch(input, init);
    const len = res.headers.get("content-length");
    record(method, url, len ? Number(len) : null);
    return res;
  };

  const OrigXHR = window.XMLHttpRequest;
  class MonitoredXHR extends OrigXHR {
    private _method = "GET";
    private _url = "";
    override open(method: string, url: string | URL): void {
      this._method = method;
      this._url = typeof url === "string" ? url : url.href;
      super.open(method, url);
    }
    override send(body?: Document | XMLHttpRequestBodyInit | null): void {
      this.addEventListener("loadend", () =>
        record(this._method, this._url, null),
      );
      super.send(body);
    }
  }
  window.XMLHttpRequest = MonitoredXHR;
}
