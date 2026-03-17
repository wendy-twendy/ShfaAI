import {
  FlaskConical,
  Swords,
  Bot,
  FileCheck,
  Layers,
} from "lucide-react";

const STATS = [
  { value: "17", label: "Attack Types", icon: Swords },
  { value: "3", label: "Agent Models", icon: Bot },
  { value: "17", label: "Clean Documents", icon: FileCheck },
  { value: "16", label: "Layer Combos", icon: Layers },
] as const;

export function ProblemIntro() {
  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-scanning" />
          <h2 className="text-sm font-semibold">Evaluation Report</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Prompt-Injection Defense Pipeline
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
        RAG systems are vulnerable to prompt injection attacks through poisoned
        documents in the knowledge base. We built a 6-layer defense pipeline and
        evaluated it across 3 models with 17 attack types and 16 layer
        configurations. Here's what we found.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border bg-card px-4 py-3 flex flex-col items-center gap-1"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
