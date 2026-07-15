/**
 * Memory Workbench — request/response types for the read-only inspection API.
 *
 * All endpoints are paginated, authenticated (when gateway apiKey is set),
 * and never mutate memory / recall / cache state.
 */

// ============================
// Common pagination
// ============================

export interface WorkbenchPageMeta {
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface WorkbenchPageResponse<T> extends WorkbenchPageMeta {
  items: T[];
}

// ============================
// Overview
// ============================

export interface WorkbenchOverviewResponse {
  data_dir: string;
  counts: {
    l0: number;
    l1: number;
    l2: number;
    l3_versions: number;
    l3_current: boolean;
  };
  pipeline: WorkbenchPipelineSummary;
  stores: {
    sqlite: boolean;
    sqlite_path: string | null;
  };
}

export interface WorkbenchPipelineSummary {
  sessions_tracked: number;
  pending_conversations: number;
  pending_l2: number;
  last_persona_at: number | null;
  last_persona_time: string | null;
  request_persona_update: boolean;
  persona_update_reason: string;
  memories_since_last_persona: number;
  scenes_processed: number;
  live_queues?: {
    l1: number;
    l2: number;
    l3: number;
    l1_idle: boolean;
    l2_idle: boolean;
    l3_idle: boolean;
  };
}

// ============================
// L0
// ============================

export interface WorkbenchL0Item {
  id: string;
  session_key: string;
  session_id: string;
  role: string;
  content: string;
  recorded_at: string;
  timestamp: number;
}

export interface WorkbenchL0ListQuery {
  offset?: number;
  limit?: number;
  q?: string;
  session_key?: string;
  session_id?: string;
  role?: string;
  since?: string;
  until?: string;
  sort?: "asc" | "desc";
}

// ============================
// L1
// ============================

export interface WorkbenchL1Item {
  id: string;
  content: string;
  type: string;
  priority: number;
  scene_name: string;
  session_key: string;
  session_id: string;
  timestamp_str: string;
  timestamp_start: string;
  timestamp_end: string;
  created_time: string;
  updated_time: string;
  metadata: Record<string, unknown>;
  /** Populated when available (JSONL dual-write); empty array when unknown. */
  source_message_ids: string[];
  /** Optional subject/actor if present in metadata or parseable from content. */
  subject?: string;
  actor?: string;
}

export interface WorkbenchL1ListQuery {
  offset?: number;
  limit?: number;
  q?: string;
  type?: string;
  scene?: string;
  session_key?: string;
  session_id?: string;
  priority_min?: number;
  priority_max?: number;
  subject?: string;
  actor?: string;
  since?: string;
  until?: string;
  sort?: "asc" | "desc";
}

export interface WorkbenchL1DetailResponse {
  memory: WorkbenchL1Item;
  provenance: {
    source_message_ids: string[];
    source_messages: WorkbenchL0Item[];
    /** IDs that could not be resolved in L0 JSONL or SQLite. */
    missing_ids: string[];
  };
}

// ============================
// L2
// ============================

export interface WorkbenchL2Item {
  filename: string;
  created: string;
  updated: string;
  summary: string;
  heat: number;
  content_preview: string;
  content_length: number;
}

export interface WorkbenchL2ListQuery {
  offset?: number;
  limit?: number;
  q?: string;
  since?: string;
  until?: string;
  sort?: "asc" | "desc";
}

export interface WorkbenchL2DetailResponse {
  filename: string;
  created: string;
  updated: string;
  summary: string;
  heat: number;
  content: string;
  related_l1: WorkbenchL1Item[];
  related_l1_total: number;
}

// ============================
// L3
// ============================

export interface WorkbenchL3Version {
  id: string;
  kind: "current" | "backup";
  path: string;
  updated_at: string | null;
  size_bytes: number;
  content_preview: string;
}

export interface WorkbenchL3DetailResponse {
  id: string;
  kind: "current" | "backup";
  path: string;
  updated_at: string | null;
  size_bytes: number;
  content: string;
}

// ============================
// Pipeline health
// ============================

export interface WorkbenchPipelineSession {
  session_key: string;
  conversation_count: number;
  last_extraction_time: string;
  last_extraction_updated_time: string;
  last_active_time: number;
  l2_pending_l1_count: number;
  warmup_threshold: number;
  l2_last_extraction_time: string;
  last_scene_name?: string;
  last_l1_cursor?: number;
  last_captured_timestamp?: number;
  /** Derived status for UI filtering. */
  status: "idle" | "pending_l1" | "pending_l2" | "warmup" | "stale";
}

export interface WorkbenchPipelineResponse {
  summary: WorkbenchPipelineSummary;
  sessions: WorkbenchPageResponse<WorkbenchPipelineSession>;
  notes: string[];
}
