import { useCallback, useEffect, useState } from "react";
import { MessageSquare, BookOpen, Eye, FlaskConical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { ChatTab } from "@/components/ChatTab";
import { KnowledgeBaseTab } from "@/components/KnowledgeBaseTab";
import { PromptVisualizer } from "@/components/PromptVisualizer";
import { EvalsTab } from "@/components/evals/EvalsTab";
import { fetchSettings } from "@/api";
import type { Settings } from "@/api";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Controlled state derived from settings once loaded
  const [enabledLayers, setEnabledLayers] = useState<number[]>([1, 4, 6]);
  const [activeDocIds, setActiveDocIds] = useState<string[]>([]);
  const [retrievalMode, setRetrievalMode] = useState<"topk" | "all">("topk");
  const [agentModel, setAgentModel] = useState("");
  const [judgeModel, setJudgeModel] = useState("");
  const [defensePromptEnabled, setDefensePromptEnabled] = useState(true);
  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s);
        setAgentModel(s.defaults.agent_model);
        setJudgeModel(s.defaults.judge_model);
        setDefensePromptEnabled(s.defaults.defense_prompt_enabled);
        // Start with all docs active
        setActiveDocIds(s.documents.map((d) => d.id));
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleEnabledLayersChange = useCallback((layers: number[]) => {
    setEnabledLayers(layers);
  }, []);

  const handleActiveDocIdsChange = useCallback((ids: string[]) => {
    setActiveDocIds(ids);
  }, []);

  const handleRetrievalModeChange = useCallback((mode: "topk" | "all") => {
    setRetrievalMode(mode);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive text-sm font-medium">
            Failed to connect to backend
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Make sure the backend is running on port 8000
          </p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            Connecting to backend...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Settings Sidebar */}
      <SettingsSidebar
        layers={settings.layers}
        enabledLayers={enabledLayers}
        onEnabledLayersChange={handleEnabledLayersChange}
        documents={settings.documents}
        activeDocIds={activeDocIds}
        onActiveDocIdsChange={handleActiveDocIdsChange}
        retrievalMode={retrievalMode}
        onRetrievalModeChange={handleRetrievalModeChange}
        models={settings.models}
        agentModel={agentModel}
        onAgentModelChange={setAgentModel}
        judgeModel={judgeModel}
        onJudgeModelChange={setJudgeModel}
        defensePromptEnabled={defensePromptEnabled}
        onDefensePromptEnabledChange={setDefensePromptEnabled}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col gap-0 min-h-0">
          <div className="border-b border-border px-4 pt-2">
            <TabsList variant="line" className="h-10 bg-transparent gap-4">
              <TabsTrigger
                value="chat"
                className="rounded-none border-none px-1 pb-2 text-xs font-medium gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="knowledge-base"
                className="rounded-none border-none px-1 pb-2 text-xs font-medium gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger
                value="visualizer"
                className="rounded-none border-none px-1 pb-2 text-xs font-medium gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Prompt Visualizer
              </TabsTrigger>
              <TabsTrigger
                value="evals"
                className="rounded-none border-none px-1 pb-2 text-xs font-medium gap-1.5"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Evals
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden min-h-0">
            <ChatTab
              enabledLayers={enabledLayers}
              activeDocIds={activeDocIds}
              retrievalMode={retrievalMode}
              agentModel={agentModel}
              judgeModel={judgeModel}
              defensePromptEnabled={defensePromptEnabled}
            />
          </TabsContent>

          <TabsContent value="knowledge-base" className="flex-1 m-0 p-4 overflow-auto min-h-0">
            <KnowledgeBaseTab />
          </TabsContent>

          <TabsContent value="visualizer" className="flex-1 flex flex-col m-0 overflow-hidden min-h-0">
            <PromptVisualizer
              enabledLayers={enabledLayers}
              activeDocIds={activeDocIds}
              retrievalMode={retrievalMode}
              agentModel={agentModel}
              judgeModel={judgeModel}
              defensePromptEnabled={defensePromptEnabled}
            />
          </TabsContent>

          <TabsContent value="evals" className="flex-1 m-0 overflow-auto min-h-0">
            <EvalsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
