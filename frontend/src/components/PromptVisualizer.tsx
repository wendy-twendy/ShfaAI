import { useState, useCallback, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Send,
  Loader2,
  Eye,
  Shield,
  FileText,
  User,
  Bot,
  Wrench,
  ChevronDown,
  ChevronRight,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PipelineTraceInline } from "@/components/PipelineTrace";
import { previewPrompt, sendChat } from "@/api";
import type { ChatRequest, ChatResponse, PromptPreviewResponse, SystemPromptBreakdown, ToolCallRecord } from "@/api";

interface Props {
  enabledLayers: number[];
  activeDocIds: string[];
  retrievalMode: "topk" | "all";
  agentModel: string;
  judgeModel: string;
  defensePromptEnabled: boolean;
}

export function PromptVisualizer({
  enabledLayers,
  activeDocIds,
  retrievalMode,
  agentModel,
  judgeModel,
  defensePromptEnabled,
}: Props) {
  const [preview, setPreview] = useState<PromptPreviewResponse | null>(null);
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current && preview) {
      scrollRef.current.scrollTop = 0;
    }
  }, [preview]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const query = input.trim();
      if (!query || isLoading) return;

      setError(null);
      setIsLoading(true);
      setInput("");

      try {
        const request: ChatRequest = {
          query,
          enabled_layers: enabledLayers,
          active_doc_ids: activeDocIds,
          retrieval_mode: retrievalMode,
          agent_model: agentModel,
          judge_model: judgeModel,
          defense_prompt_enabled: defensePromptEnabled,
        };

        const [result, chat] = await Promise.all([
          previewPrompt(request),
          sendChat(request),
        ]);
        setPreview(result);
        setChatResponse(chat);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, enabledLayers, activeDocIds, retrievalMode, agentModel, judgeModel, defensePromptEnabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const totalChars = preview
    ? preview.messages.reduce((sum, m) => sum + m.content.length, 0)
    : 0;
  const approxTokens = Math.round(totalChars / 4);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Results area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        {!preview && !isLoading && <EmptyState />}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-scanning mx-auto" />
              <p className="text-xs text-muted-foreground">Running sanitization pipeline...</p>
            </div>
          </div>
        )}

        {preview && !isLoading && (
          <div className="space-y-4">
            {/* Header with stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Prompt Preview</span>
              </div>
              <Badge className="text-[9px] px-1.5 h-4 bg-scanning/15 text-scanning border-scanning/30 font-mono">
                ~{approxTokens.toLocaleString()} tokens
              </Badge>
              <Badge className="text-[9px] px-1.5 h-4 font-mono">
                {preview.messages.length} messages
              </Badge>
              <ConfigBadges config={preview.config_snapshot} />
            </div>

            {/* System Prompt */}
            <SystemPromptSection breakdown={preview.system_prompt_breakdown} />

            {/* Retrieved Context */}
            {preview.surviving_chunks.length > 0 && (
              <RetrievedContextSection
                chunks={preview.surviving_chunks}
                docs={preview.retrieved_docs}
              />
            )}

            {/* User Query */}
            <UserQuerySection
              query={preview.messages.find((m) => m.label === "user_query")?.content ?? ""}
            />

            {/* Tool Definitions */}
            <ToolDefinitionsSection tools={preview.tool_definitions} />

            {/* Pipeline Trace */}
            {preview.pipeline_trace.length > 0 && (
              <PipelineTraceInline trace={preview.pipeline_trace} />
            )}

            {/* LLM Response */}
            {chatResponse && (
              <LLMResponseSection answer={chatResponse.answer} toolCalls={chatResponse.tool_calls} />
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a query to preview the assembled prompt..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              style={{ minHeight: "38px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Press Enter to preview. This runs the pipeline but does NOT call the LLM.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
      <Eye className="h-8 w-8 text-primary/50" />
      <div>
        <p className="text-sm font-medium text-foreground/70">Prompt Visualizer</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Enter a query to see the exact messages array that would be sent to the LLM.
          Includes system prompt, retrieved context (post-sanitization), and tool definitions.
        </p>
      </div>
    </div>
  );
}

function ConfigBadges({ config }: { config: Record<string, unknown> }) {
  const layers = (config.enabled_layers as number[]) ?? [];
  const defense = config.defense_prompt_enabled as boolean;
  const mode = config.retrieval_mode as string;

  return (
    <div className="flex items-center gap-1 ml-auto">
      {layers.length > 0 && (
        <Badge className="text-[8px] px-1 py-0 h-3.5 font-mono bg-primary/10 text-primary border-primary/20">
          {layers.map((l) => `L${l}`).join(" ")}
        </Badge>
      )}
      <Badge
        className={`text-[8px] px-1 py-0 h-3.5 font-mono ${
          defense
            ? "bg-safe/15 text-safe border-safe/30"
            : "bg-muted text-muted-foreground"
        }`}
      >
        Defense {defense ? "ON" : "OFF"}
      </Badge>
      <Badge className="text-[8px] px-1 py-0 h-3.5 font-mono bg-muted text-muted-foreground">
        {mode}
      </Badge>
    </div>
  );
}

function SystemPromptSection({ breakdown }: { breakdown: SystemPromptBreakdown }) {
  return (
    <div className="rounded-lg border border-scanning/30 bg-scanning/5">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-scanning/20">
        <Shield className="h-3.5 w-3.5 text-scanning" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-scanning">
          System Prompt
        </span>
        <Badge className="text-[8px] px-1 py-0 h-3.5 ml-auto bg-scanning/15 text-scanning border-scanning/30 font-mono">
          role: system
        </Badge>
      </div>
      <div className="px-3 py-3 space-y-2">
        {/* Base prompt */}
        <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {breakdown.base}
        </div>

        {/* Defense instruction */}
        {breakdown.defense_instruction !== null ? (
          <div className="border-l-2 border-safe pl-3 bg-safe/5 rounded-r py-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Badge className="text-[7px] px-1 py-0 h-3 bg-safe/15 text-safe border-safe/30 font-mono">
                DEFENSE INSTRUCTION — ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {breakdown.defense_instruction}
            </p>
          </div>
        ) : (
          <div className="border-l-2 border-muted pl-3 opacity-40 py-1.5">
            <Badge className="text-[7px] px-1 py-0 h-3 font-mono">
              DEFENSE INSTRUCTION — INACTIVE
            </Badge>
          </div>
        )}

        {/* Datamarking instruction */}
        {breakdown.datamarking_instruction !== null ? (
          <div className="border-l-2 border-safe pl-3 bg-safe/5 rounded-r py-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Badge className="text-[7px] px-1 py-0 h-3 bg-safe/15 text-safe border-safe/30 font-mono">
                DATAMARKING INSTRUCTION — ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {breakdown.datamarking_instruction.replace(/\uE000/g, "\u00B7")}
            </p>
          </div>
        ) : (
          <div className="border-l-2 border-muted pl-3 opacity-40 py-1.5">
            <Badge className="text-[7px] px-1 py-0 h-3 font-mono">
              DATAMARKING INSTRUCTION — INACTIVE
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function RetrievedContextSection({
  chunks,
  docs,
}: {
  chunks: string[];
  docs: Record<string, unknown>[];
}) {
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  const toggleChunk = (i: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-warning/20">
        <FileText className="h-3.5 w-3.5 text-warning" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-warning">
          Retrieved Context
        </span>
        <Badge className="text-[8px] px-1.5 py-0 h-3.5 bg-warning/15 text-warning border-warning/30 font-mono">
          {chunks.length} chunk{chunks.length !== 1 ? "s" : ""}
        </Badge>
        <Badge className="text-[8px] px-1 py-0 h-3.5 ml-auto bg-warning/15 text-warning border-warning/30 font-mono">
          role: user
        </Badge>
      </div>
      <div className="px-3 py-2 space-y-2">
        <p className="text-[10px] text-muted-foreground font-mono">
          &lt;retrieved_context&gt;
        </p>
        {chunks.map((chunk, i) => {
          const expanded = expandedChunks.has(i);
          const doc = docs[i];
          const isPoisoned = doc?.category === "poisoned";
          const displayChunk = chunk.replace(/\uE000/g, "\u00B7");

          return (
            <div
              key={i}
              className={`rounded border ${
                isPoisoned ? "border-threat/20 bg-threat/5" : "border-border/30 bg-background/30"
              }`}
            >
              <button
                onClick={() => toggleChunk(i)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-accent/30 transition-colors rounded"
              >
                {expanded ? (
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-[10px] font-mono text-muted-foreground">
                  Chunk {i + 1}
                </span>
                {doc && (
                  <span className="text-[10px] font-medium text-foreground/70 truncate">
                    {doc.title as string}
                  </span>
                )}
                {isPoisoned && (
                  <Badge variant="destructive" className="text-[7px] px-1 py-0 h-3 ml-auto shrink-0">
                    poisoned
                  </Badge>
                )}
              </button>
              {expanded && (
                <div className="px-2 pb-2">
                  <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-words leading-snug bg-background/50 rounded px-2 py-1.5 border border-border/20 max-h-64 overflow-y-auto">
                    {displayChunk}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground font-mono">
          &lt;/retrieved_context&gt;
        </p>
      </div>
    </div>
  );
}

function UserQuerySection({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/20">
        <User className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          User Query
        </span>
        <Badge className="text-[8px] px-1 py-0 h-3.5 ml-auto bg-primary/15 text-primary border-primary/30 font-mono">
          role: user
        </Badge>
      </div>
      <div className="px-3 py-3">
        <p className="text-xs text-foreground whitespace-pre-wrap">{query}</p>
      </div>
    </div>
  );
}

function ToolDefinitionsSection({ tools }: { tools: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors rounded-lg"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tool Definitions
        </span>
        <Badge className="text-[9px] px-1.5 py-0 h-4 ml-auto font-mono">
          {tools.length}
        </Badge>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
          {tools.map((tool, i) => {
            const fn = (tool as { function?: { name?: string; description?: string; parameters?: unknown } }).function;
            if (!fn) return null;
            return (
              <div key={i} className="rounded border border-border/50 bg-background/50 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {fn.name}
                  </span>
                </div>
                {fn.description && (
                  <p className="text-[10px] text-muted-foreground mb-1.5">{fn.description}</p>
                )}
                {fn.parameters != null && (
                  <pre className="text-[9px] font-mono text-foreground/70 whitespace-pre-wrap bg-background/80 rounded px-2 py-1 border border-border/20">
                    {JSON.stringify(fn.parameters, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LLMResponseSection({ answer, toolCalls }: { answer: string; toolCalls: ToolCallRecord[] }) {
  return (
    <div className="rounded-lg border border-safe/30 bg-safe/5">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-safe/20">
        <Bot className="h-3.5 w-3.5 text-safe" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-safe">
          LLM Response
        </span>
        <Badge className="text-[8px] px-1 py-0 h-3.5 ml-auto bg-safe/15 text-safe border-safe/30 font-mono">
          role: assistant
        </Badge>
      </div>
      <div className="px-3 py-3 space-y-3">
        {toolCalls.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tool Calls
            </span>
            {toolCalls.map((tc, i) => (
              <div
                key={i}
                className={`rounded border px-2 py-1.5 text-[10px] font-mono ${
                  tc.status === "allowed"
                    ? "border-safe/20 bg-safe/5"
                    : "border-threat/20 bg-threat/5"
                }`}
              >
                <span className="font-semibold">{tc.name}</span>
                ({Object.entries(tc.arguments).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})
                <Badge
                  variant={tc.status === "allowed" ? "default" : "destructive"}
                  className="text-[8px] px-1 py-0 h-3.5 ml-2"
                >
                  {tc.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}
