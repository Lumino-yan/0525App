export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'log' | 'suggestion' | 'alert' | 'create' | 'summary';

export interface Message {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  metadata?: {
    progressBefore?: number;
    progressAfter?: number;
    parsedIntent?: string;
  };
  timestamp: number;
}

// ---- Thought (Flash Capsule) ----

export type ThoughtColor = 'red' | 'orange' | 'blue' | 'green' | 'purple' | null;

export interface Thought {
  id: string;
  content: string;
  color: ThoughtColor;
  projectId?: string;
  createdAt: number;
  processed: boolean;
}

// ---- ThoughtNote — follow-up notes attached to a thought ----

export interface ThoughtNote {
  id: string;
  thoughtId: string;
  content: string;
  createdAt: number;
}

// ---- Task (project breakdown step) ----

export interface Task {
  id: string;
  projectId: string;
  content: string;
  completed: boolean;
  order: number;
}

// ---- Project ----

export interface Project {
  id: string;
  name: string;
  description: string;
  urgency: Urgency;
  deadline: string | null;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  completedAt: number | null;
  manualProgress: number | null;
  pinned: boolean;
  lastMessagePreview: string;
  lastMessageAt: number;
  tasks: Task[];
  aiSummary: string;
}

// ---- AppData ----

export interface AppData {
  thoughts: Thought[];
  thoughtNotes: ThoughtNote[];
  tasks: Task[];
  projects: Project[];
  messages: Message[];
}

// ---- Smart Ranking ----

export interface SmartTask {
  project: Project;
  reason: string;
  priorityScore: number;
  suggestedAction: string;
  urgency: 'now' | 'soon' | 'later';
}

// ---- AI Organization Results ----

export interface AIOrgSuggestion {
  type: 'project_group';
  suggestedName: string;
  thoughtIds: string[];
  reason: string;
}

export interface AIExtractedTask {
  type: 'task';
  content: string;
  thoughtIds: string[];
  suggestedProjectId?: string;
}

export interface AIOrganizeResult {
  projectSuggestions: AIOrgSuggestion[];
  extractedTasks: AIExtractedTask[];
  focusGuidance: string;
}
