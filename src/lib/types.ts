export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export interface ProgressLog {
  id: string;
  projectId: string;
  content: string;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  urgency: Urgency;
  deadline: string | null; // ISO date string or null
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  completedAt: number | null;
  manualProgress: number | null; // 0-100, null means auto
}

export interface AppData {
  projects: Project[];
  logs: ProgressLog[];
}

export interface SmartTask {
  project: Project;
  reason: string;
  priorityScore: number;
  suggestedAction: string;
  urgency: 'now' | 'soon' | 'later';
}
