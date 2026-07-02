import type { Settings } from "./useSettings";

type Props = {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  onClose: () => void;
};

export function SettingsPopover({
  settings,
  onUpdate,
  onClose,
}: Props): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute right-4 top-12 flex w-80 flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <label className="text-[0.68rem] uppercase tracking-wide text-faint">
            System prompt
          </label>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            rows={4}
            placeholder="e.g. You are a concise, friendly assistant."
            className="mt-1 w-full resize-none rounded-lg border border-hairline-strong bg-surface-2 px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="flex justify-between text-[0.68rem] uppercase tracking-wide text-faint">
            <span>Temperature</span>
            <span className="tabular-nums">{settings.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => onUpdate({ temperature: Number(e.target.value) })}
            className="mt-1.5 w-full accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
