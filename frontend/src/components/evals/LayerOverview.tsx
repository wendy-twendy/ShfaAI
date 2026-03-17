import {
  Zap,
  FileText,
  Cpu,
  Brain,
  Tag,
  Gavel,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LAYERS } from "./eval-data";

const LAYER_ICONS: Record<number, LucideIcon> = {
  1: Zap,
  2: FileText,
  3: Cpu,
  4: Brain,
  5: Tag,
  6: Gavel,
};

const BORDER_COLORS: Record<number, string> = {
  1: "border-l-muted-foreground/40",
  2: "border-l-muted-foreground/40",
  3: "border-l-muted-foreground/40",
  4: "border-l-scanning",
  5: "border-l-muted-foreground/40",
  6: "border-l-safe",
};

export function LayerOverview() {
  return (
    <section className="space-y-4">
      {/* Heading */}
      <h2 className="text-sm font-semibold">Defense Pipeline</h2>

      {/* Pipeline cards */}
      <div className="grid grid-cols-6 gap-1 items-start">
        {LAYERS.map((layer, i) => {
          const Icon = LAYER_ICONS[layer.number];
          return (
            <div key={layer.number} className="flex items-start">
              <div
                className={`flex-1 rounded-lg border border-l-2 ${BORDER_COLORS[layer.number]} bg-card px-3 py-3 space-y-2`}
              >
                {/* Layer badge + icon */}
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                    L{layer.number}
                  </div>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                {/* Name */}
                <p className="text-xs font-medium text-foreground leading-tight">
                  {layer.name}
                </p>

                {/* Description */}
                <p className="text-[10px] text-muted-foreground leading-snug">
                  {layer.description}
                </p>

                {/* Detection rate badge */}
                <div className="pt-1">
                  <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {layer.detectionRate.gemini} detected
                  </span>
                </div>
              </div>

              {/* Arrow between cards */}
              {i < LAYERS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-5 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
