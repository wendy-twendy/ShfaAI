import {
  Target,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { COST_TRADEOFFS } from "./eval-data";

export function Recommendations() {
  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-scanning" />
        <h2 className="text-sm font-semibold">Recommendations</h2>
      </div>

      {/* 3 Recommendation Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Card 1: Minimum Viable Defense */}
        <div className="rounded-lg border border-safe/30 bg-safe/5 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-safe" />
            <span className="text-xs font-semibold text-foreground">
              Minimum Viable Defense
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              L4
            </span>
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              L6
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            LLM chunk judge + tool call judge. 2 extra LLM calls per request.
            Catches everything through complementary mechanisms.
          </p>

          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-safe/15 text-safe">
            0% ASR
          </span>
        </div>

        {/* Card 2: Recommended Production */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Recommended Production
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {["L1", "L2", "L3", "L4", "L5", "L6"].map((layer) => (
              <span
                key={layer}
                className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {layer}
              </span>
            ))}
            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Defense Prompt
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Maximum redundancy. Fast preprocessing (L1+L2), ML detection (L3),
            LLM judge (L4), trust boundaries (L5), execution gate (L6).
          </p>

          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-safe/15 text-safe">
            0% ASR
          </span>
        </div>

        {/* Card 3: Don't Rely On Alone */}
        <div className="rounded-lg border border-threat/30 bg-threat/5 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-threat" />
            <span className="text-xs font-semibold text-foreground">
              Don't Rely On Alone
            </span>
          </div>

          <ul className="space-y-1.5">
            <li className="text-xs text-muted-foreground leading-snug">
              L5 without defense prompt — 35.3% ASR (same as baseline)
            </li>
            <li className="text-xs text-muted-foreground leading-snug">
              L1+L2 alone — 23.5% ASR
            </li>
            <li className="text-xs text-muted-foreground leading-snug">
              L3 alone — 29.4% ASR
            </li>
            <li className="text-xs text-muted-foreground leading-snug">
              L4 alone — 17.6% ASR (model-dependent)
            </li>
          </ul>
        </div>
      </div>

      {/* Cost Tradeoffs Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground">
          Cost Tradeoffs
        </h3>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Config
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  ASR
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  LLM Calls/Req
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Latency
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Best For
                </th>
              </tr>
            </thead>
            <tbody>
              {COST_TRADEOFFS.map((row, i) => (
                <tr
                  key={row.config}
                  className={i < COST_TRADEOFFS.length - 1 ? "border-b" : ""}
                >
                  <td className="px-3 py-2 font-mono text-foreground">
                    {row.config}
                  </td>
                  <td className="px-3 py-2 font-mono text-safe">
                    {row.asr}
                  </td>
                  <td className="px-3 py-2 font-mono text-foreground">
                    {row.llmCalls}
                  </td>
                  <td className="px-3 py-2 font-mono text-foreground">
                    {row.latency}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground italic">
                    {row.bestFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
