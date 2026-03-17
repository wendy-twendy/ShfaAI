import { GitCompareArrows, Lightbulb } from "lucide-react";
import { MODELS, ATTACKS } from "./eval-data";

function asrColor(asr: number) {
  if (asr === 0) return "text-safe";
  if (asr <= 5.9) return "text-safe";
  if (asr <= 20) return "text-warning";
  return "text-threat";
}

function formatAsr(asr: number) {
  return `${asr.toFixed(1)}%`;
}

function attackLabel(attackId: string): string {
  return ATTACKS.find((a) => a.id === attackId)?.label ?? attackId;
}

type MetricRow = {
  label: string;
  key: string;
  highlight?: boolean;
};

const METRIC_ROWS: MetricRow[] = [
  { label: "Baseline ASR", key: "baselineAsr" },
  { label: "Defense Prompt ASR", key: "defensePromptAsr" },
  { label: "L4 Solo ASR", key: "l4Asr" },
  { label: "L6 Solo ASR", key: "l6Asr", highlight: true },
  { label: "Full Pipeline ASR", key: "fullPipelineAsr" },
  { label: "Min ASR Achieved", key: "minAsr" },
  { label: "Unblockable Attacks", key: "unblockableAttacks" },
];

export function CrossModelComparison() {
  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <GitCompareArrows className="h-4 w-4 text-scanning" />
        <h2 className="text-sm font-semibold">Cross-Model Comparison</h2>
      </div>

      {/* Comparison Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Metric
              </th>
              {MODELS.map((model) => (
                <th
                  key={model.id}
                  className="text-left px-3 py-2 font-medium text-muted-foreground"
                >
                  {model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => (
              <tr
                key={row.key}
                className={`border-t border-border ${
                  row.highlight ? "bg-scanning/5" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium">{row.label}</td>
                {MODELS.map((model) => {
                  if (row.key === "unblockableAttacks") {
                    const attacks = model.unblockableAttacks;
                    const display =
                      attacks.length === 0
                        ? "none"
                        : attacks.map(attackLabel).join(", ");
                    return (
                      <td
                        key={model.id}
                        className={`px-3 py-2 ${
                          attacks.length === 0
                            ? "text-safe"
                            : "text-threat"
                        }`}
                      >
                        {display}
                      </td>
                    );
                  }

                  const value = model[
                    row.key as keyof typeof model
                  ] as number;
                  return (
                    <td
                      key={model.id}
                      className={`px-3 py-2 font-mono ${asrColor(value)}`}
                    >
                      {formatAsr(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Callout card */}
      <div className="rounded-lg border border-scanning/30 bg-scanning/5 px-4 py-3 flex items-start gap-3">
        <Lightbulb className="h-4 w-4 text-scanning shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          L6 is the only universally reliable layer — 5.9% ASR across all
          three models, regardless of agent capability.
        </p>
      </div>

      {/* Vulnerability Profile Cards */}
      <div className="grid grid-cols-3 gap-3">
        {MODELS.map((model) => (
          <div
            key={model.id}
            className="rounded-lg border bg-card px-3 py-3 space-y-2"
          >
            <p className="text-xs font-medium">{model.name}</p>
            <p className="text-[10px] text-muted-foreground">
              Unique vulnerabilities
            </p>
            <div className="flex flex-wrap gap-1">
              {model.uniqueVulnerabilities.length === 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  —
                </span>
              ) : (
                model.uniqueVulnerabilities.map((attackId) => (
                  <span
                    key={attackId}
                    className="inline-block text-[10px] px-1.5 py-0.5 rounded border bg-threat/10 text-threat border-threat/20"
                  >
                    {attackLabel(attackId)}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
