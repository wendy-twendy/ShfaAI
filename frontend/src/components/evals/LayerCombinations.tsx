import { useMemo } from "react";
import { Info, Combine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MODELS, type ModelId, type SweepConfig, type Verdict } from "./eval-data";

interface Props {
  selectedModel: ModelId;
}

const VERDICT_CLASSES: Record<Verdict, string> = {
  BEST: "bg-safe/15 text-safe border-safe/30",
  GOOD: "bg-safe/10 text-safe/80 border-transparent",
  PARTIAL: "bg-warning/15 text-warning border-transparent",
  WEAK: "bg-threat/10 text-threat/80 border-transparent",
  BASELINE: "bg-muted text-muted-foreground border-transparent",
};

function formatLatency(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function getCalloutMessage(model: (typeof MODELS)[number]): string {
  if (model.minCombo !== null) {
    const combo = `[${model.minCombo.join(", ")}]`;
    return `${combo} is the minimum combination achieving 0% ASR — L4 catches attacks at content level, L6 catches them at execution.`;
  }
  return "No combination achieves 0% ASR — bad_likert_judge defeats all layers. L6 alone provides the best protection at 5.9%.";
}

function isMinComboRow(row: SweepConfig, minCombo: number[] | null): boolean {
  if (!minCombo) return false;
  if (row.layers.length !== minCombo.length) return false;
  return minCombo.every((l, i) => row.layers[i] === l);
}

export function LayerCombinations({ selectedModel }: Props) {
  const model = MODELS.find((m) => m.id === selectedModel)!;

  const sortedSweep = useMemo(
    () => [...model.sweep].sort((a, b) => a.asr - b.asr),
    [model.sweep],
  );

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Combine className="h-4 w-4 text-scanning" />
          <h2 className="text-sm font-semibold">Layer Combinations</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Hyperparameter sweep — which layer combos work?
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Layers
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                ASR
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Latency
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSweep.map((row, i) => {
              const isHighlighted = isMinComboRow(row, model.minCombo);
              return (
                <tr
                  key={i}
                  className={`border-b last:border-b-0 transition-colors hover:bg-muted/20 ${
                    isHighlighted ? "border-l-2 border-l-safe bg-safe/5" : ""
                  }`}
                >
                  {/* Layers */}
                  <td className="px-4 py-2.5">
                    {row.layers.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {row.layers.map((l) => (
                          <span
                            key={l}
                            className="inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground"
                          >
                            L{l}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 italic">
                        none
                      </span>
                    )}
                  </td>

                  {/* ASR */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium tabular-nums w-10">
                        {row.asr}%
                      </span>
                      <div className="w-20 rounded-full bg-muted/30 h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            row.asr > 0 ? "bg-threat" : "bg-safe"
                          }`}
                          style={{
                            width: `${Math.min((row.asr / 50) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Latency */}
                  <td className="px-4 py-2.5 text-muted-foreground font-mono">
                    {formatLatency(row.latencyMs)}
                  </td>

                  {/* Verdict */}
                  <td className="px-4 py-2.5">
                    <Badge className={VERDICT_CLASSES[row.verdict]}>
                      {row.verdict}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Callout card */}
      <div className="rounded-lg border border-scanning/30 bg-scanning/5 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-scanning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {getCalloutMessage(model)}
        </p>
      </div>
    </section>
  );
}
