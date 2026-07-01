import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, type NetEntry } from "./netMonitor";

export function useNetMonitor(): NetEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}
