import { useState } from "react";
import {
  FlaskConical,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { runEvals } from "@/api";
import type { EvalResult } from "@/api";

export function EvalPanel() {
  const [results, setResults] = useState<EvalResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const handleRunEvals = async () => {
    setIsLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const res = await runEvals();
      setResults(res);
      setElapsed(Date.now() - start);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval run failed");
    } finally {
      setIsLoading(false);
    }
  };

  const passed = results?.filter((r) => r.passed).length ?? 0;
  const total = results?.length ?? 0;
  const failed = total - passed;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header + Run Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-scanning" />
          <h2 className="text-sm font-semibold">Evaluation Suite</h2>
        </div>

        <button
          onClick={handleRunEvals}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running Evals...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Run All Evals
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Summary Bar */}
      {results && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-safe" />
              <span className="text-sm font-semibold text-safe">{passed}</span>
              <span className="text-xs text-muted-foreground">passed</span>
            </div>
            {failed > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-threat" />
                <span className="text-sm font-semibold text-threat">{failed}</span>
                <span className="text-xs text-muted-foreground">failed</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">
                {elapsed !== null ? `${(elapsed / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-safe transition-all"
              style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {passed}/{total}
          </span>
        </div>
      )}

      {/* Results Table */}
      {results && (
        <div className="space-y-1.5">
          {results.map((result, i) => (
            <EvalResultRow key={i} result={result} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!results && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-60">
          <FlaskConical className="h-8 w-8 text-scanning/50" />
          <div>
            <p className="text-sm font-medium text-foreground/70">No eval results yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Click "Run All Evals" to test all attack scenarios against the current pipeline configuration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Eval Result Row ── */

function EvalResultRow({ result }: { result: EvalResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-card ${
        result.passed ? "border-border" : "border-threat/30"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors rounded-lg"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        {/* Pass/Fail icon */}
        {result.passed ? (
          <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-threat shrink-0" />
        )}

        {/* Scenario name */}
        <span className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">
          {result.scenario.name}
        </span>

        {/* Layers badge */}
        <Badge variant="secondary" className="text-[9px] px-1.5 h-4 font-mono shrink-0">
          L{result.scenario.enabled_layers.length > 0
            ? result.scenario.enabled_layers.join(",")
            : "none"}
        </Badge>

        {/* Timing */}
        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 shrink-0">
          <Clock className="h-2.5 w-2.5" />
          {(result.elapsed_ms / 1000).toFixed(1)}s
        </span>

        {/* Status */}
        <Badge
          variant={result.passed ? "default" : "destructive"}
          className="text-[9px] px-1.5 py-0 h-4 shrink-0"
        >
          {result.passed ? "PASS" : "FAIL"}
        </Badge>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-border/50 pt-3">
          {/* Query */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Query
            </p>
            <p className="text-xs text-foreground/80 bg-background/50 rounded px-2 py-1.5 border border-border/50">
              {result.scenario.query}
            </p>
          </div>

          {/* Failure reasons */}
          {result.failure_reasons.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-threat mb-1">
                Failure Reasons
              </p>
              <div className="space-y-1">
                {result.failure_reasons.map((reason, ri) => (
                  <div key={ri} className="flex items-start gap-2 text-xs text-threat bg-threat/5 rounded px-2 py-1.5 border border-threat/10">
                    <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer preview */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Agent Answer
            </p>
            <p className="text-xs text-foreground/70 bg-background/50 rounded px-2 py-1.5 border border-border/50 line-clamp-4">
              {result.response.answer}
            </p>
          </div>

          {/* Tool calls */}
          {result.response.tool_calls.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Tool Calls ({result.response.tool_calls.length})
              </p>
              <div className="space-y-1">
                {result.response.tool_calls.map((tc, ti) => (
                  <div
                    key={ti}
                    className={`flex items-center gap-2 text-xs font-mono rounded px-2 py-1.5 border ${
                      tc.status === "allowed"
                        ? "border-safe/20 bg-safe/5"
                        : "border-threat/20 bg-threat/5"
                    }`}
                  >
                    <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-semibold">{tc.name}</span>
                    <span className="text-muted-foreground truncate">
                      ({Object.entries(tc.arguments).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})
                    </span>
                    <Badge
                      variant={tc.status === "allowed" ? "default" : "destructive"}
                      className="text-[9px] px-1 py-0 h-4 ml-auto shrink-0"
                    >
                      {tc.status === "allowed" ? "ALLOWED" : "BLOCKED"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security events */}
          {result.response.security_events.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Security Events ({result.response.security_events.length})
              </p>
              <div className="space-y-1">
                {result.response.security_events.map((evt, ei) => (
                  <div key={ei} className="flex items-start gap-2 text-[11px] px-2 py-1 rounded bg-warning/5 border border-warning/10">
                    <ShieldAlert className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                    <span className="font-mono font-semibold text-warning">[{evt.layer}]</span>
                    <span className="text-foreground/80">{evt.event_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
