import { cn } from "../lib";
import { btnPrimary } from "../ui/styles";
import type { BenchResult } from "./useChat";

type Props = {
  modelReady: boolean;
  running: boolean;
  results: BenchResult[];
  onRun: () => void;
};

export function BenchmarkView({
  modelReady,
  running,
  results,
  onRun,
}: Props): React.JSX.Element {
  return (
    <div
      data-testid="benchmark-view"
      className="mx-auto flex min-h-0 w-full max-w-[46rem] flex-1 flex-col gap-4 overflow-y-auto p-6"
    >
      <div>
        <h2 className="text-lg font-bold tracking-tight">On-device benchmark</h2>
        <p className="text-sm text-muted">
          Measured on your GPU, right now — real numbers, nothing synthetic. Load
          different models and run again to compare.
        </p>
      </div>

      <button
        className={cn(btnPrimary, "self-start")}
        onClick={onRun}
        disabled={!modelReady || running}
      >
        {running
          ? "Running…"
          : modelReady
            ? "Run benchmark on loaded model"
            : "Load a model first"}
      </button>

      {results.length > 0 && (
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-hairline text-left text-faint">
              <th className="py-2 font-medium">Model</th>
              <th className="py-2 text-right font-medium">TTFT</th>
              <th className="py-2 text-right font-medium">Prefill</th>
              <th className="py-2 text-right font-medium">Decode</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-hairline">
                <td className="py-2">{r.model}</td>
                <td className="py-2 text-right">{r.ttftMs} ms</td>
                <td className="py-2 text-right">
                  {r.prefillTokPerSec.toFixed(1)} t/s
                </td>
                <td className="py-2 text-right">
                  {r.decodeTokPerSec.toFixed(1)} t/s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
