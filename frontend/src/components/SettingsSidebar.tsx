import { useCallback, useMemo } from "react";
import {
  Shield,
  FileText,
  Zap,
  Brain,
  Cpu,
  Tag,
  Gavel,
  Database,
  Radio,
  Server,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// Using plain overflow-y-auto div instead of Radix ScrollArea
// because ScrollArea uses display:table internally which prevents
// horizontal content from being constrained to sidebar width.
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LayerInfo, DocumentInfo } from "@/api";

// Layer metadata: icons and estimated latency
const LAYER_META: Record<
  number,
  { icon: typeof Shield; latency: string }
> = {
  1: { icon: Zap, latency: "<1ms" },
  2: { icon: FileText, latency: "<1ms" },
  3: { icon: Cpu, latency: "15-30ms" },
  4: { icon: Brain, latency: "200-400ms" },
  5: { icon: Tag, latency: "<1ms" },
  6: { icon: Gavel, latency: "200-400ms" },
};

type Preset = "none" | "default" | "full" | "custom";

function detectPreset(enabled: number[]): Preset {
  const s = new Set(enabled);
  if (s.size === 0) return "none";
  if (s.size === 6 && [1, 2, 3, 4, 5, 6].every((n) => s.has(n)))
    return "full";
  if (s.size === 3 && s.has(1) && s.has(4) && s.has(6))
    return "default";
  return "custom";
}

const PRESET_LAYERS: Record<Exclude<Preset, "custom">, number[]> = {
  none: [],
  default: [1, 4, 6],
  full: [1, 2, 3, 4, 5, 6],
};

interface Props {
  layers: LayerInfo[];
  enabledLayers: number[];
  onEnabledLayersChange: (layers: number[]) => void;
  documents: DocumentInfo[];
  activeDocIds: string[];
  onActiveDocIdsChange: (ids: string[]) => void;
  retrievalMode: "topk" | "all";
  onRetrievalModeChange: (mode: "topk" | "all") => void;
  models: Record<string, string>;
  agentModel: string;
  onAgentModelChange: (model: string) => void;
  judgeModel: string;
  onJudgeModelChange: (model: string) => void;
  defensePromptEnabled: boolean;
  onDefensePromptEnabledChange: (enabled: boolean) => void;
}

export function SettingsSidebar({
  layers,
  enabledLayers,
  onEnabledLayersChange,
  documents,
  activeDocIds,
  onActiveDocIdsChange,
  retrievalMode,
  onRetrievalModeChange,
  models,
  agentModel,
  onAgentModelChange,
  judgeModel,
  onJudgeModelChange,
  defensePromptEnabled,
  onDefensePromptEnabledChange,
}: Props) {
  const preset = detectPreset(enabledLayers);

  const toggleLayer = useCallback(
    (num: number, checked: boolean) => {
      onEnabledLayersChange(
        checked
          ? [...enabledLayers, num].sort()
          : enabledLayers.filter((n) => n !== num)
      );
    },
    [enabledLayers, onEnabledLayersChange]
  );

  const applyPreset = useCallback(
    (p: string) => {
      if (p !== "custom") {
        onEnabledLayersChange(PRESET_LAYERS[p as Exclude<Preset, "custom">]);
      }
    },
    [onEnabledLayersChange]
  );

  const toggleDoc = useCallback(
    (id: string, checked: boolean) => {
      onActiveDocIdsChange(
        checked
          ? [...activeDocIds, id]
          : activeDocIds.filter((d) => d !== id)
      );
    },
    [activeDocIds, onActiveDocIdsChange]
  );

  const cleanDocs = useMemo(
    () => documents.filter((d) => d.category === "clean"),
    [documents]
  );
  const poisonedDocs = useMemo(
    () => documents.filter((d) => d.category === "poisoned"),
    [documents]
  );

  const setDocGroup = useCallback(
    (group: "all" | "clean" | "poisoned" | "none") => {
      switch (group) {
        case "all":
          onActiveDocIdsChange(documents.map((d) => d.id));
          break;
        case "clean":
          onActiveDocIdsChange(cleanDocs.map((d) => d.id));
          break;
        case "poisoned":
          onActiveDocIdsChange(poisonedDocs.map((d) => d.id));
          break;
        case "none":
          onActiveDocIdsChange([]);
          break;
      }
    },
    [documents, cleanDocs, poisonedDocs, onActiveDocIdsChange]
  );

  const modelEntries = useMemo(
    () => Object.entries(models),
    [models]
  );

  return (
    <aside className="w-80 shrink-0 border-r border-border flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-tight">
          Defense Controls
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="p-4 space-y-6">
          {/* ── Preset ── */}
          <section>
            <SectionHeader label="Preset" />
            <Select value={preset} onValueChange={applyPreset}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Protection</SelectItem>
                <SelectItem value="default">
                  Default (L1+L4+L6)
                </SelectItem>
<SelectItem value="full">Full Pipeline</SelectItem>
                <SelectItem value="custom" disabled>
                  Custom
                </SelectItem>
              </SelectContent>
            </Select>
          </section>

          <Separator />

          {/* ── Pipeline Layers ── */}
          <section>
            <SectionHeader label="Pipeline Layers" />
            <div className="space-y-1">
              {layers.map((layer) => {
                const meta = LAYER_META[layer.number];
                const Icon = meta?.icon ?? Shield;
                const enabled = enabledLayers.includes(layer.number);
                const disabled = !layer.available;

                const row = (
                  <div
                    key={layer.number}
                    className={`group flex items-start gap-3 rounded-md px-2 py-2 transition-colors ${
                      enabled
                        ? "bg-primary/5"
                        : "hover:bg-accent"
                    } ${disabled ? "opacity-40" : ""}`}
                  >
                    {/* Pipeline position indicator */}
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
                          enabled
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        L{layer.number}
                      </div>
                      {/* Connector line to next layer */}
                      {layer.number < 6 && (
                        <div
                          className={`w-px h-3 mt-1 ${
                            enabled ? "bg-primary/30" : "bg-border"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-medium truncate">
                          {layer.name}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                          {meta?.latency}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                        {layer.description}
                      </p>
                    </div>

                    <Switch
                      checked={enabled}
                      onCheckedChange={(c) => toggleLayer(layer.number, c)}
                      disabled={disabled}
                      className="mt-0.5 scale-90"
                    />
                  </div>
                );

                if (disabled) {
                  return (
                    <Tooltip key={layer.number}>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="right" className="max-w-52 text-xs">
                        Install <code>onnxruntime</code> &{" "}
                        <code>optimum</code> to enable ML classification.
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return row;
              })}
            </div>
          </section>

          <Separator />

          {/* ── Defense Prompt ── */}
          <section>
            <SectionHeader label="Defense Prompt" icon={Shield} />
            <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 bg-primary/5">
              <div className="min-w-0">
                <p className="text-xs font-medium">System prompt hardening</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                  Instructs the LLM to ignore injected instructions. Required for datamarking (L5).
                </p>
              </div>
              <Switch
                checked={defensePromptEnabled}
                onCheckedChange={onDefensePromptEnabledChange}
                className="shrink-0 scale-90"
              />
            </div>
          </section>

          <Separator />

          {/* ── Retrieval Mode ── */}
          <section>
            <SectionHeader label="Retrieval Mode" icon={Radio} />
            <RadioGroup
              value={retrievalMode}
              onValueChange={(v) =>
                onRetrievalModeChange(v as "topk" | "all")
              }
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="topk" id="topk" />
                <Label htmlFor="topk" className="text-xs cursor-pointer">
                  Top-K Keyword Match
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-xs cursor-pointer">
                  All Active Docs
                </Label>
              </div>
            </RadioGroup>
          </section>

          <Separator />

          {/* ── Model Pickers ── */}
          <section>
            <SectionHeader label="Models" icon={Server} />
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  Agent Model
                </Label>
                <Select value={agentModel} onValueChange={onAgentModelChange}>
                  <SelectTrigger className="h-7 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelEntries.map(([key, id]) => (
                      <SelectItem key={key} value={id} className="text-xs font-mono">
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  Judge Model (L4 & L6)
                </Label>
                <Select value={judgeModel} onValueChange={onJudgeModelChange}>
                  <SelectTrigger className="h-7 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelEntries.map(([key, id]) => (
                      <SelectItem key={key} value={id} className="text-xs font-mono">
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Knowledge Base ── */}
          <section>
            <SectionHeader label="Knowledge Base" icon={Database} />
            <div className="flex gap-1 mb-3">
              {(
                [
                  ["All", "all"],
                  ["Clean", "clean"],
                  ["Poisoned", "poisoned"],
                  ["None", "none"],
                ] as const
              ).map(([label, group]) => (
                <button
                  key={group}
                  onClick={() => setDocGroup(group)}
                  className="px-2 py-0.5 text-[10px] font-medium rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Clean docs */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Clean Documents ({cleanDocs.length})
              </p>
              <div className="space-y-1">
                {cleanDocs.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    checked={activeDocIds.includes(doc.id)}
                    onCheckedChange={(c) => toggleDoc(doc.id, c)}
                  />
                ))}
              </div>
            </div>

            {/* Poisoned docs */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-threat mb-1.5">
                Poisoned Documents ({poisonedDocs.length})
              </p>
              <div className="space-y-1">
                {poisonedDocs.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    checked={activeDocIds.includes(doc.id)}
                    onCheckedChange={(c) => toggleDoc(doc.id, c)}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>
      </div>
    </aside>
  );
}

/* ── Helpers ── */

function SectionHeader({
  label,
  icon: Icon,
}: {
  label: string;
  icon?: typeof Shield;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
    </div>
  );
}

function DocRow({
  doc,
  checked,
  onCheckedChange,
}: {
  doc: DocumentInfo;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent transition-colors cursor-pointer min-w-0">
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        className="scale-90 shrink-0"
      />
      <span className="text-xs truncate flex-1 min-w-0">{doc.title}</span>
      {doc.attack_type && (
        <Badge
          variant="destructive"
          className="text-[9px] px-1 py-0 h-4 font-mono shrink-0 whitespace-nowrap"
        >
          {doc.attack_type.split("_")[0]}
        </Badge>
      )}
    </label>
  );
}
