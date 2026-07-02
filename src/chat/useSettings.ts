import { useCallback, useState } from "react";

// Generation settings (persona + sampling), persisted locally. Applied to every
// conversation; the system prompt lets the user shape the assistant's voice.

export type Settings = {
  systemPrompt: string;
  temperature: number;
};

const STORAGE_KEY = "local-ai-kit:settings";
const DEFAULTS: Settings = { systemPrompt: "", temperature: 0.7 };

function initial(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings(): {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
} {
  const [settings, setSettings] = useState<Settings>(initial);

  const update = useCallback((patch: Partial<Settings>): void => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}
