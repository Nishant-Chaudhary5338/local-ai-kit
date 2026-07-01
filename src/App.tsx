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
import { useRag } from "./rag/useRag";
import { DocsPanel } from "./rag/DocsPanel";
import { useJournal } from "./journal/useJournal";
import { JournalView } from "./journal/JournalView";
import "./App.css";

type Mode = "chat" | "journal";

export default function App(): React.JSX.Element {
  const [cap, setCap] = useState<Capability | null>(null);
  const [modelId, setModelId] = useState<string>(defaultModelId(1));
  const [trustOpen, setTrustOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const chat = useChat();
  const rag = useRag();
  const journal = useJournal(rag.indexSource, rag.removeSource, rag.ready);

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
      >
        <DocsPanel
          status={rag.status}
          progress={rag.progress}
          indexing={rag.indexing}
          sources={rag.docSources}
          onEnable={() => void rag.loadEmbedder()}
          onAddDoc={(file) => void rag.addDocument(file)}
          onRemoveDoc={(source) => void rag.removeSource(source)}
        />
      </Sidebar>

      <section className="main">
        <div className="tabs">
          <button
            className={`tab ${mode === "chat" ? "tab--active" : ""}`}
            onClick={() => setMode("chat")}
          >
            Chat
          </button>
          <button
            className={`tab ${mode === "journal" ? "tab--active" : ""}`}
            onClick={() => setMode("journal")}
          >
            Journal
          </button>
          {!trustOpen && (
            <button className="trust-open" onClick={() => setTrustOpen(true)}>
              Trust panel ‹
            </button>
          )}
        </div>

        {mode === "chat" ? (
          <>
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

            <MessageList
              messages={chat.active?.messages ?? []}
              modelReady={modelReady}
            />

            <div className="composer-wrap">
              {rag.ready && rag.sources.length > 0 && (
                <p className="rag-hint">
                  🔎 Answering from {rag.sources.length} private source
                  {rag.sources.length > 1 ? "s" : ""} · cited, on-device
                </p>
              )}
              <Composer
                disabled={!modelReady || chat.generating}
                generating={chat.generating}
                onSend={(text) =>
                  void (async () => {
                    const context = await rag.retrieve(text);
                    await chat.send(text, context);
                  })()
                }
              />
              {chat.stats && (
                <p className="stats">
                  prefill {chat.stats.prefillTokPerSec.toFixed(1)} tok/s · decode{" "}
                  {chat.stats.decodeTokPerSec.toFixed(1)} tok/s
                </p>
              )}
            </div>
          </>
        ) : (
          <JournalView
            entries={journal.entries}
            active={journal.active}
            activeId={journal.activeId}
            indexing={rag.indexing}
            embedderReady={rag.ready}
            onCreate={() => void journal.create()}
            onSelect={journal.select}
            onUpdate={journal.update}
            onRemove={(id) => void journal.remove(id)}
            onReflect={() => setMode("chat")}
          />
        )}
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
