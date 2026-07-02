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
import { BenchmarkView } from "./chat/BenchmarkView";
import { CommandPalette, type Command } from "./ui/CommandPalette";
import { SettingsPopover } from "./chat/SettingsPopover";
import { useSettings } from "./chat/useSettings";
import { useTheme } from "./theme/useTheme";
import type { BenchResult } from "./chat/useChat";

type Mode = "chat" | "journal" | "benchmark";

const TAB_BASE = "cursor-pointer border-b-2 px-3.5 pb-2.5 pt-2 transition";
const MODES: Mode[] = ["chat", "journal", "benchmark"];

export default function App(): React.JSX.Element {
  const [cap, setCap] = useState<Capability | null>(null);
  const [modelId, setModelId] = useState<string>(defaultModelId(1));
  const [trustOpen, setTrustOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [benchResults, setBenchResults] = useState<BenchResult[]>([]);
  const chat = useChat();
  const rag = useRag();
  const journal = useJournal(rag.indexSource, rag.removeSource, rag.ready);
  const { theme, toggle: toggleTheme } = useTheme();
  const { settings, update: updateSettings } = useSettings();

  useEffect(() => {
    chat.configure(settings);
  }, [settings, chat.configure]);

  const reflect = (prompt: string): void => {
    setMode("chat");
    void (async () => {
      const hit = await rag.retrieve(prompt);
      await chat.send(prompt, hit?.context ?? null, hit?.sources);
    })();
  };

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
  const hasMessages = (chat.active?.messages.length ?? 0) > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runBenchmark = async (): Promise<void> => {
    const result = await chat.benchmark();
    if (result) setBenchResults((rs) => [result, ...rs]);
  };

  const commands: Command[] = [
    { id: "new", label: "New chat", run: () => void chat.newChat() },
    { id: "chat", label: "Go to Chat", run: () => setMode("chat") },
    { id: "journal", label: "Go to Journal", run: () => setMode("journal") },
    { id: "benchmark", label: "Go to Benchmark", run: () => setMode("benchmark") },
    {
      id: "theme",
      label: "Toggle theme",
      hint: theme,
      run: toggleTheme,
    },
    {
      id: "trust",
      label: trustOpen ? "Hide trust panel" : "Show trust panel",
      run: () => setTrustOpen((o) => !o),
    },
    { id: "settings", label: "Open settings", run: () => setSettingsOpen(true) },
  ];

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
          {MODES.map((m) => (
            <button
              key={m}
              className={cn(
                TAB_BASE,
                "capitalize",
                mode === m
                  ? "border-accent font-semibold text-fg"
                  : "border-transparent text-muted hover:text-fg",
              )}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 pb-1.5">
            <button
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
              className="rounded-md border border-hairline-strong px-2 py-1 leading-none transition hover:bg-surface-hover"
            >
              ⚙️
            </button>
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

        {mode === "chat" && (
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
              <div className="mb-2 flex min-h-[1.1rem] items-center justify-between gap-2">
                {rag.ready && rag.sources.length > 0 ? (
                  <p className="text-[0.78rem] font-medium text-accent-strong">
                    🔎 Answering from {rag.sources.length} private source
                    {rag.sources.length > 1 ? "s" : ""} · cited, on-device
                  </p>
                ) : (
                  <span />
                )}
                {hasMessages && !chat.generating && (
                  <button
                    onClick={() => void chat.regenerate()}
                    className="text-[0.78rem] text-muted transition hover:text-fg"
                  >
                    ↻ Regenerate
                  </button>
                )}
              </div>
              <Composer
                disabled={!modelReady || chat.generating}
                generating={chat.generating}
                allowImage={chat.modelCapability === "vision"}
                onStop={chat.stop}
                onSend={(text, image) =>
                  void (async () => {
                    const hit = image ? null : await rag.retrieve(text);
                    await chat.send(text, hit?.context ?? null, hit?.sources, image);
                  })()
                }
              />
              <div className="mt-2 flex items-center justify-between text-[0.78rem] tabular-nums text-faint">
                <span>
                  {chat.stats
                    ? `prefill ${chat.stats.prefillTokPerSec.toFixed(1)} · decode ${chat.stats.decodeTokPerSec.toFixed(1)} tok/s`
                    : ""}
                </span>
                {modelReady && chat.contextTokens > 0 && (
                  <span>
                    context {chat.contextTokens}/{chat.contextWindow}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {mode === "journal" && (
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
            onReflect={reflect}
          />
        )}

        {mode === "benchmark" && (
          <BenchmarkView
            modelReady={modelReady}
            running={chat.generating}
            results={benchResults}
            onRun={() => void runBenchmark()}
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

      <CommandPalette
        open={paletteOpen}
        commands={commands}
        onClose={() => setPaletteOpen(false)}
      />

      {settingsOpen && (
        <SettingsPopover
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
