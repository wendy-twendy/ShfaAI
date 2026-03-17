import { Bug, XCircle, CheckCircle2 } from "lucide-react";
import { FPR_FIX_RESULTS } from "./eval-data";

function asrColor(value: number): string {
  if (value === 0) return "text-safe";
  if (value < 10) return "text-safe";
  if (value < 30) return "text-warning";
  return "text-threat";
}

export function FprFix() {
  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-scanning" />
          <h2 className="text-sm font-semibold">False Positive Fix</h2>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
        The L6 tool judge was incorrectly blocking user-requested tool calls
        (emails, document shares) because it flagged email bodies as
        &ldquo;derived from retrieved content.&rdquo; When a user asks to email
        someone about a policy, of course the body comes from documents &mdash;
        that&rsquo;s expected behavior. We updated the L6 prompt to focus on
        whether the action itself (tool, recipient, target) was user-requested,
        not whether the payload content came from docs.
      </p>

      {/* Before / After cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before card */}
        <div className="rounded-lg border border-threat/30 bg-threat/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-threat" />
            <span className="text-xs font-semibold text-threat">Before</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            L6 blocked legitimate tool calls when email bodies contained
            doc-derived content
          </p>
          <div className="rounded bg-background/50 p-3 space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <p>
              User: &quot;Email compliance@ about ethics reporting&quot;
            </p>
            <p className="text-threat">
              L6: BLOCK &mdash; &quot;body synthesized from retrieved
              documents&quot;
            </p>
          </div>
        </div>

        {/* After card */}
        <div className="rounded-lg border border-safe/30 bg-safe/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-safe" />
            <span className="text-xs font-semibold text-safe">After</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            L6 now checks if the action was user-requested, allowing doc-derived
            content in body
          </p>
          <div className="rounded bg-background/50 p-3 space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <p>
              User: &quot;Email compliance@ about ethics reporting&quot;
            </p>
            <p className="text-safe">
              L6: ALLOW &mdash; &quot;user explicitly requested this
              email&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Config
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Gemini ASR
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Ministral ASR
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Gemini FPR
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Ministral FPR
              </th>
            </tr>
          </thead>
          <tbody>
            {FPR_FIX_RESULTS.map((row) => (
              <tr
                key={row.config}
                className="border-b last:border-b-0 transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">
                  {row.config}
                </td>
                <td
                  className={`px-4 py-2.5 font-mono tabular-nums ${asrColor(row.geminiAsr)}`}
                >
                  {row.geminiAsr.toFixed(1)}%
                </td>
                <td
                  className={`px-4 py-2.5 font-mono tabular-nums ${asrColor(row.ministralAsr)}`}
                >
                  {row.ministralAsr.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-safe">
                    <CheckCircle2 className="h-3 w-3" />
                    {row.geminiFpr.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-safe">
                    <CheckCircle2 className="h-3 w-3" />
                    {row.ministralFpr.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
