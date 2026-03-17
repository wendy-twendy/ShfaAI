// Typed API client for the prompt-injection defense backend.
// Types mirror backend/models.py Pydantic models.

export interface LayerInfo {
  number: number;
  name: string;
  description: string;
  available: boolean;
}

export interface DocumentInfo {
  id: string;
  title: string;
  category: "clean" | "poisoned";
  attack_type: string | null;
}

export interface Settings {
  layers: LayerInfo[];
  documents: DocumentInfo[];
  models: Record<string, string>;
  defaults: {
    agent_model: string;
    judge_model: string;
    defense_prompt_enabled: boolean;
  };
}

export interface SecurityEvent {
  timestamp: string;
  event_type: string;
  layer: string;
  details: Record<string, unknown>;
}

export interface LayerResult {
  layer_number: number;
  chunks_in: string[];
  chunks_out: string[];
  flagged: string[];
  security_events: SecurityEvent[];
  execution_time_ms: number;
  chunk_categories: string[];
}

export interface ToolCallRecord {
  name: string;
  arguments: Record<string, unknown>;
  status: "allowed" | "blocked";
  judge_reason: string;
  call_id: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  query: string;
  enabled_layers: number[];
  active_doc_ids: string[];
  retrieval_mode: "topk" | "all";
  agent_model?: string;
  judge_model?: string;
  defense_prompt_enabled?: boolean;
  conversation_history?: ConversationTurn[];
}

export interface ChatResponse {
  answer: string;
  tool_calls: ToolCallRecord[];
  security_events: SecurityEvent[];
  pipeline_trace: LayerResult[];
  retrieved_docs: Record<string, unknown>[];
}

export interface EvalScenario {
  id: string;
  name: string;
  query: string;
  enabled_layers: number[];
  active_doc_ids: string[];
  expected: Record<string, unknown>;
}

export interface EvalResult {
  scenario: EvalScenario;
  passed: boolean;
  failure_reasons: string[];
  elapsed_ms: number;
  response: ChatResponse;
}

export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  category: "clean" | "poisoned";
  attack_type: string | null;
  content: string;
}

export interface PromptMessage {
  role: string;
  content: string;
  label: "system_prompt" | "retrieved_context" | "user_query";
}

export interface SystemPromptBreakdown {
  base: string;
  defense_instruction: string | null;
  datamarking_instruction: string | null;
}

export interface PromptPreviewResponse {
  messages: PromptMessage[];
  system_prompt_breakdown: SystemPromptBreakdown;
  tool_definitions: Record<string, unknown>[];
  pipeline_trace: LayerResult[];
  security_events: SecurityEvent[];
  retrieved_docs: Record<string, unknown>[];
  surviving_chunks: string[];
  config_snapshot: Record<string, unknown>;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
  return res.json();
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function runEvals(): Promise<EvalResult[]> {
  const res = await fetch("/api/eval", { method: "POST" });
  if (!res.ok) throw new Error(`Eval failed: ${res.status}`);
  return res.json();
}

export async function fetchKnowledgeBase(): Promise<KnowledgeBaseDocument[]> {
  const res = await fetch("/api/knowledge-base");
  if (!res.ok) throw new Error(`Knowledge base fetch failed: ${res.status}`);
  return res.json();
}

export async function previewPrompt(request: ChatRequest): Promise<PromptPreviewResponse> {
  const res = await fetch("/api/preview-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
  return res.json();
}
