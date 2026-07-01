import { useEffect, useMemo, useState } from "react";
import {
  detectCapability,
  recommendedTier,
  defaultModelId,
  resolveModelId,
  type Capability,
} from "./lib";
import { useChat } from "./chat/useChat";
import { Sidebar } from "./chat/Sidebar";
import { ModelBar } from "./chat/ModelBar";
import { MessageList } from "./chat/MessageList";
import { Composer } from "./chat/Composer";
import { TrustPanel } from "./trust/TrustPanel";
import "./App.css";

export default function App(): React.JSX.Element {
  const [cap, setCap] = useState<Capability | null>(null);
  const [modelId, setModelId] = useState<string>(defaultModelId(1));
  const [trustOpen, setTrustOpen] = useState(true);
  const chat = useChat();

  useEffect(() => {
    void detectCapability().then((c) => {
      setCap(c);
      setModelId(defaultModelId(recommendedTier(c)));
    });
  }, []);

  const gpuStatus = useMemo(() => {
    if (cap === null) return "checking";
    return cap.adapter ? "available" : "unavailable";
  }, [cap]);

  const modelReady = chat.model.status === "ready";

  return (
    <div className={`layout ${trustOpen ? "layout--trust" : ""}`}>
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeId}
        onSelect={chat.selectChat}
        onNew={() => void chat.newChat()}
        onRemove={(id) => void chat.removeChat(id)}
      />

      <section className="main">
        <ModelBar
          cap={cap}
          gpuStatus={gpuStatus}
          modelId={modelId}
          onModelId={setModelId}
          model={chat.model}
          onLoad={(id) =>
            void chat.loadModel(resolveModelId(id, cap?.shaderF16 ?? false))
          }
        />

        {!trustOpen && (
          <button className="trust-open" onClick={() => setTrustOpen(true)}>
            Trust panel ‹
          </button>
        )}

        <MessageList
          messages={chat.active?.messages ?? []}
          modelReady={modelReady}
        />

        <div className="composer-wrap">
          <Composer
            disabled={!modelReady || chat.generating}
            generating={chat.generating}
            onSend={(text) => void chat.send(text)}
          />
          {chat.stats && (
            <p className="stats">
              prefill {chat.stats.prefillTokPerSec.toFixed(1)} tok/s · decode{" "}
              {chat.stats.decodeTokPerSec.toFixed(1)} tok/s
            </p>
          )}
        </div>
      </section>

      {trustOpen && (
        <TrustPanel
          cap={cap}
          modelStatus={chat.model.status}
          generating={chat.generating}
          stats={chat.stats}
          onClose={() => setTrustOpen(false)}
        />
      )}
    </div>
  );
}
