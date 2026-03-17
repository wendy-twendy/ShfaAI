import { Fragment } from "react";
import { Grid3X3 } from "lucide-react";
import { ATTACKS, MODELS, type CellResult, type ModelId } from "./eval-data";

const LAYER_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

const MODEL_BUTTONS: { id: ModelId; label: string }[] = [
  { id: "gemini", label: "Gemini" },
  { id: "qwen", label: "Qwen" },
  { id: "ministral", label: "Ministral" },
];

function cellStyle(result: CellResult, isAltRow: boolean) {
  switch (result) {
    case "BLKD":
      return "bg-safe/15 text-safe";
    case "LEAK":
      return "bg-threat/15 text-threat";
    case "safe":
      return `${isAltRow ? "bg-muted/30" : "bg-transparent"} text-muted-foreground/40`;
  }
}

function cellText(result: CellResult) {
  switch (result) {
    case "BLKD":
      return "BLKD";
    case "LEAK":
      return "LEAK";
    case "safe":
      return "\u2014";
  }
}

function asrColor(asr: number) {
  if (asr === 0) return "text-safe";
  if (asr < 10) return "text-safe";
  if (asr < 30) return "text-warning";
  return "text-threat";
}

interface AblationMatrixProps {
  selectedModel: ModelId;
  onModelChange: (m: ModelId) => void;
}

export function AblationMatrix({
  selectedModel,
  onModelChange,
}: AblationMatrixProps) {
  const model = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];
  const matrix = model.ablation;

  // Compute per-layer ASR: LEAKs / (LEAKs + BLKDs)
  const layerAsr = LAYER_NUMBERS.map((layerNum) => {
    let leaks = 0;
    let blkds = 0;
    for (const attack of ATTACKS) {
      const cell = matrix[attack.id]?.[layerNum];
      if (cell === "LEAK") leaks++;
      else if (cell === "BLKD") blkds++;
    }
    const total = leaks + blkds;
    return total === 0 ? 0 : (leaks / total) * 100;
  });

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-scanning" />
          <h2 className="text-sm font-semibold">Layer Ablation Matrix</h2>
        </div>
      </div>

      {/* Model selector */}
      <div className="flex gap-0">
        {MODEL_BUTTONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onModelChange(id)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
              selectedModel === id
                ? "bg-primary text-primary-foreground"
                : "bg-card border hover:bg-accent/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Heatmap table */}
      <div
        className="grid text-center"
        style={{
          gridTemplateColumns: "160px repeat(6, 1fr)",
        }}
      >
        {/* Header row */}
        <div /> {/* Empty top-left cell */}
        {LAYER_NUMBERS.map((n) => (
          <div
            key={n}
            className="text-[10px] uppercase font-mono text-muted-foreground py-2"
          >
            L{n}
          </div>
        ))}

        {/* Attack rows */}
        {ATTACKS.map((attack, rowIdx) => (
          <Fragment key={attack.id}>
            {/* Attack name cell */}
            <div
              className={`text-left text-xs py-1.5 px-2 flex items-center gap-1.5 ${
                rowIdx % 2 === 1 ? "bg-muted/30" : ""
              }`}
            >
              <span className="truncate">{attack.label}</span>
              {attack.isNovel && (
                <span className="text-[8px] bg-scanning/20 text-scanning rounded px-1 shrink-0">
                  new
                </span>
              )}
            </div>

            {/* Layer cells */}
            {LAYER_NUMBERS.map((layerNum) => {
              const result = matrix[attack.id]?.[layerNum] ?? "safe";
              const isAltRow = rowIdx % 2 === 1;
              return (
                <div
                  key={`${attack.id}-L${layerNum}`}
                  className={`text-[10px] font-mono py-1.5 ${cellStyle(result, isAltRow)}`}
                >
                  {cellText(result)}
                </div>
              );
            })}
          </Fragment>
        ))}

        {/* Summary ASR row */}
        <div className="text-left text-xs font-semibold py-2 px-2 border-t border-border">
          ASR
        </div>
        {layerAsr.map((asr, i) => (
          <div
            key={`asr-L${LAYER_NUMBERS[i]}`}
            className={`text-[10px] font-mono font-semibold py-2 border-t border-border ${asrColor(asr)}`}
          >
            {asr.toFixed(0)}%
          </div>
        ))}
      </div>
    </section>
  );
}
