import { useState } from "react";
import type { ModelId } from "./eval-data";
import { ProblemIntro } from "./ProblemIntro";
import { LayerOverview } from "./LayerOverview";
import { AblationMatrix } from "./AblationMatrix";
import { LayerCombinations } from "./LayerCombinations";
import { CrossModelComparison } from "./CrossModelComparison";
import { Recommendations } from "./Recommendations";

export function EvalsTab() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini");

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <ProblemIntro />
        <LayerOverview />
        <AblationMatrix
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <LayerCombinations selectedModel={selectedModel} />
        <CrossModelComparison />
        <Recommendations />
      </div>
    </div>
  );
}
