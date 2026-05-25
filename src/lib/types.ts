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
}

export interface AppData {
  projects: Project[];
  messages: Message[];
}

export interface SmartTask {
  project: Project;
  reason: string;
  priorityScore: number;
  suggestedAction: string;
  urgency: 'now' | 'soon' | 'later';
}
