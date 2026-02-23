export interface SearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

export interface BoardEntry {
  id: number;
  source: { url: string; title: string; snippet: string };
  note: string;
  reaction: Record<string, string>;
}

export interface ActionInfo {
  name: string;
  arguments: Record<string, unknown>;
}

// SSE event types from backend
export interface RunStartEvent {
  type: "run_start";
  title: string;
  outcomes: string;
  step_limit: number;
  cost_limit: number;
}

export interface StepStartEvent {
  type: "step_start";
  step: number;
  model_cost: number;
  search_cost: number;
  total_cost: number;
}

export interface ModelResponseEvent {
  type: "model_response";
  content: string;
  thinking: string;
  actions: ActionInfo[];
}

export interface ObservationEvent {
  type: "observation";
  tool: string;
  error: boolean;
  output_text: string;
  query?: string;
  search_results?: SearchSource[];
  source_id?: string;
  note?: string;
  board_id?: number;
  new_note?: string;
  probabilities?: Record<string, number>;
}

export interface RunEndEvent {
  type: "run_end";
  exit_status: string;
  submission: Record<string, number>;
  board: BoardEntry[];
  error?: string;
}

export type AgentEvent =
  | RunStartEvent
  | StepStartEvent
  | ModelResponseEvent
  | ObservationEvent
  | RunEndEvent;

// Chat message types for the UI
export type ChatMessageType =
  | "user"
  | "plan"
  | "divider"
  | "step"
  | "think"
  | "result"
  | "error";

export interface StepSearchData {
  query: string;
  results: SearchSource[];
  count: number;
}

export interface StepAddSourceData {
  sourceId: string;
  note: string;
}

export interface StepEditNoteData {
  boardId: number;
  newNote: string;
}

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: number;
  // step-specific data
  stepNumber?: number;
  toolName?: string;
  searchData?: StepSearchData;
  addSourceData?: StepAddSourceData;
  editNoteData?: StepEditNoteData;
  submission?: Record<string, number>;
  exitStatus?: string;
  board?: BoardEntry[];
  isError?: boolean;
  // plan data
  planTitle?: string;
  planOutcomes?: string[];
}

export interface SearchGroup {
  stepNumber: number;
  query: string;
  results: SearchSource[];
}

export interface UserSettings {
  model_class: "litellm" | "openrouter";
  model_name: string;
  search_backend: "perplexity" | "brave";
  openrouter_api_key: string;
  perplexity_api_key: string;
  brave_api_key: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  model_class: "litellm",
  model_name: "google/gemini-2.5-flash-preview-05-20",
  search_backend: "perplexity",
  openrouter_api_key: "",
  perplexity_api_key: "",
  brave_api_key: "",
};
