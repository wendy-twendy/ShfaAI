import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LayerResult } from "@/api";

const LAYER_NAMES: Record<number, string> = {
  1: "L1 — Text Normalization",
  2: "L2 — Heuristic Scanner",
  3: "L3 — ML Classifier",
  4: "L4 — LLM Chunk Judge",
  5: "L5 — Datamarking",
  6: "L6 — Tool Call Judge",
};

export function PipelineTraceInline({ trace }: { trace: LayerResult[] }) {
  const [expanded, setExpanded] = useState(false);

  const totalDropped = trace.reduce((sum, l) => sum + (l.chunks_in.length - l.chunks_out.length), 0);
  const totalFlagged = trace.reduce((sum, l) => sum + l.flagged.length, 0);
  const totalTime = trace.reduce((sum, l) => sum + l.execution_time_ms, 0);

  return (
    <div className="rounded-md border border-border bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent/50 transition-colors rounded-md"
      >
        {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        <Layers className="h-3 w-3 text-scanning" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pipeline Trace
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground">
            {totalTime.toFixed(0)}ms
          </span>
          {totalDropped > 0 && (
            <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">
              {totalDropped} dropped
            </Badge>
          )}
          {totalFlagged > 0 && totalDropped === 0 && (
            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-warning/15 text-warning border-warning/30">
              {totalFlagged} flagged
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          {trace.map((layer, i) => (
            <LayerTraceRow key={i} layer={layer} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayerTraceRow({ layer }: { layer: LayerResult }) {
  const [expanded, setExpanded] = useState(false);
  const dropped = layer.chunks_in.length - layer.chunks_out.length;
  const hasFlagged = layer.flagged.length > 0;
  const hasDropped = dropped > 0;
  const hasEvents = layer.security_events.length > 0;
  const layerName = LAYER_NAMES[layer.layer_number] || `L${layer.layer_number}`;
  const isL6 = layer.layer_number === 6;
  const droppedLabel = isL6 ? "blocked" : "dropped";
  const droppedItemLabel = isL6 ? "BLOCKED" : "DROPPED";

  return (
    <div className={`rounded border ${hasDropped ? "border-threat/30" : hasFlagged ? "border-warning/30" : "border-border/50"} bg-background/50`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-accent/30 transition-colors rounded"
      >
        {expanded ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" /> : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}

        <div className="flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold bg-primary/15 text-primary">
          L{layer.layer_number}
        </div>

        <span className="text-[11px] font-medium text-foreground">
          {layerName}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5">
            <Clock className="h-2 w-2" />
            {layer.execution_time_ms.toFixed(0)}ms
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">
            {layer.chunks_in.length}&rarr;{layer.chunks_out.length}
          </span>
          {hasDropped && (
            <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">
              {dropped} {droppedLabel}
            </Badge>
          )}
          {hasFlagged && !hasDropped && (
            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-warning/15 text-warning border-warning/30">
              {layer.flagged.length} flagged
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-border/30 pt-2">
          {/* Chunks */}
          <div className="space-y-1">
            {layer.chunks_in.map((chunk, ci) => {
              const wasFlagged = layer.flagged.includes(chunk);
              const wasDropped = !layer.chunks_out.includes(chunk);
              const category = layer.chunk_categories?.[ci];
              return (
                <div
                  key={ci}
                  className={`rounded px-2 py-1 text-[10px] font-mono leading-snug border ${
                    wasDropped
                      ? "border-threat/20 bg-threat/5 text-foreground/60 line-through"
                      : wasFlagged
                      ? "border-warning/20 bg-warning/5 text-foreground/80"
                      : "border-border/30 bg-background/30 text-foreground/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {category === "poisoned" ? (
                      <Badge variant="destructive" className="text-[7px] px-1 py-0 h-3 font-sans">poisoned</Badge>
                    ) : category === "clean" ? (
                      <Badge className="text-[7px] px-1 py-0 h-3 font-sans bg-safe/15 text-safe border-safe/30">clean</Badge>
                    ) : null}
                    {wasDropped && (
                      <span className="text-threat text-[8px] font-sans font-semibold" style={{ textDecoration: 'none' }}>{droppedItemLabel}</span>
                    )}
                    {wasFlagged && !wasDropped && (
                      <span className="text-warning text-[8px] font-sans font-semibold">FLAGGED</span>
                    )}
                  </div>
                  <span className="line-clamp-2">{chunk.slice(0, 200)}{chunk.length > 200 ? "..." : ""}</span>
                </div>
              );
            })}
          </div>

          {/* Layer security events */}
          {hasEvents && (
            <div className="space-y-1">
              {layer.security_events.map((evt, ei) => (
                <div key={ei} className="flex items-start gap-1.5 text-[10px] px-2 py-1 rounded bg-warning/5 border border-warning/10">
                  <ShieldAlert className="h-2.5 w-2.5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground/80">{evt.event_type}</span>
                    {typeof evt.details?.chunk_preview === "string" && (
                      <p className="text-muted-foreground truncate">{(evt.details.chunk_preview as string).slice(0, 120)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
