import { useEffect, useMemo, useState } from "react";
import {
  detectCapability,
  recommendedTier,
  defaultModelId,
  resolveModelId,
  cn,
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
import { useTheme } from "./theme/useTheme";

type Mode = "chat" | "journal";

const TAB_BASE =
  "cursor-pointer border-b-2 px-3.5 pb-2.5 pt-2 transition";

export default function App(): React.JSX.Element {
  const [cap, setCap] = useState<Capability | null>(null);
  const [modelId, setModelId] = useState<string>(defaultModelId(1));
  const [trustOpen, setTrustOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const chat = useChat();
  const rag = useRag();
  const journal = useJournal(rag.indexSource, rag.removeSource, rag.ready);
  const { theme, toggle: toggleTheme } = useTheme();

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
    <div
      className={cn(
        "grid h-dvh",
        trustOpen ? "grid-cols-[272px_1fr_336px]" : "grid-cols-[272px_1fr]",
      )}
    >
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

      <section className="flex min-h-0 flex-col">
        <div className="flex items-center gap-1 border-b border-hairline bg-surface/60 px-4 pt-1.5 backdrop-blur">
          <button
            className={cn(
              TAB_BASE,
              mode === "chat"
                ? "border-accent font-semibold text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
            onClick={() => setMode("chat")}
          >
            Chat
          </button>
          <button
            className={cn(
              TAB_BASE,
              mode === "journal"
                ? "border-accent font-semibold text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
            onClick={() => setMode("journal")}
          >
            Journal
          </button>
          <div className="ml-auto flex items-center gap-1.5 pb-1.5">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="rounded-md border border-hairline-strong px-2 py-1 leading-none transition hover:bg-surface-hover"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {!trustOpen && (
              <button
                onClick={() => setTrustOpen(true)}
                className="rounded-md border border-hairline-strong px-2.5 py-1 text-[0.78rem] transition hover:bg-surface-hover"
              >
                Trust panel ‹
              </button>
            )}
          </div>
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

            <div className="border-t border-hairline bg-surface px-4 pb-4 pt-3.5">
              {rag.ready && rag.sources.length > 0 && (
                <p className="mb-2 text-[0.78rem] font-medium text-accent-strong">
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
                <p className="mt-2 text-[0.78rem] tabular-nums text-faint">
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
