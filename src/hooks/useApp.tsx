import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AppData, Project, Message, Thought, ThoughtNote, Task, ThoughtColor, Urgency, AIOrganizeResult } from '../lib/types';
import {
  getData,
  addProject as storageAddProject,
  updateProject as storageUpdateProject,
  deleteProject as storageDeleteProject,
  toggleProjectComplete as storageToggleComplete,
  addMessage as storageAddMessage,
  deleteMessage as storageDeleteMessage,
  addThought as storageAddThought,
  updateThought as storageUpdateThought,
  deleteThought as storageDeleteThought,
  addThoughtNote as storageAddThoughtNote,
  updateThoughtNote as storageUpdateThoughtNote,
  deleteThoughtNote as storageDeleteThoughtNote,
  addTask as storageAddTask,
  updateTask as storageUpdateTask,
  deleteTask as storageDeleteTask,
  resetData,
} from '../lib/storage';
import {
  generateSmartTasks,
  estimateProgress,
  generateId,
  getTaskProgress,
} from '../lib/engine';
import {
  organizeInbox as llmOrganizeInbox,
  generateProjectGuidance as llmGenerateProjectGuidance,
  generateFocusGuidance as llmGenerateFocusGuidance,
} from '../lib/llmService';
import type { SmartTask } from '../lib/types';

interface AppContextValue {
  data: AppData;
  refresh: () => void;
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleComplete: (id: string) => void;
  addMessage: (msg: Message) => void;
  deleteMessage: (id: string) => void;
  sendMessage: (content: string, projectId?: string) => Promise<void>;
  resetAll: () => void;
  smartTasks: SmartTask[];
  getProgress: (projectId: string) => number;

  // Thoughts
  addThought: (content: string, color?: ThoughtColor) => void;
  updateThought: (id: string, updates: Partial<Thought>) => void;
  deleteThought: (id: string) => void;

  // ThoughtNotes
  addThoughtNote: (thoughtId: string, content: string) => void;
  updateThoughtNote: (id: string, updates: Partial<ThoughtNote>) => void;
  deleteThoughtNote: (id: string) => void;

  // Tasks
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // AI Organization
  organizeInbox: () => Promise<AIOrganizeResult | null>;
  createProjectFromThoughts: (name: string, thoughtIds: string[], urgency?: Urgency) => Project;
  generateFocusGuidance: () => Promise<string | null>;
  generateProjectGuidance: (projectId: string) => Promise<string | null>;

  // Task progress
  getTaskProgress: (projectId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const data = getData();
  const smartTasks = generateSmartTasks(data.projects);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  // ---- Project CRUD ----

  const addProject = useCallback((p: Project) => {
    storageAddProject(p);
    refresh();
  }, [refresh]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    storageUpdateProject(id, updates);
    refresh();
  }, [refresh]);

  const deleteProject = useCallback((id: string) => {
    storageDeleteProject(id);
    refresh();
  }, [refresh]);

  const toggleComplete = useCallback((id: string) => {
    storageToggleComplete(id);
    refresh();
  }, [refresh]);

  // ---- Message CRUD ----

  const addMessage = useCallback((msg: Message) => {
    storageAddMessage(msg);
    refresh();
  }, [refresh]);

  const deleteMessage = useCallback((id: string) => {
    storageDeleteMessage(id);
    refresh();
  }, [refresh]);

  const sendMessage = useCallback(async (content: string, existingProjectId?: string) => {
    const projectId = existingProjectId ?? '';
    const timestamp = Date.now();

    const userMsg: Message = {
      id: generateId(),
      projectId,
      role: 'user',
      content,
      type: 'log',
      timestamp,
    };
    storageAddMessage(userMsg);

    const project = projectId ? data.projects.find((p) => p.id === projectId) : null;
    const progress = project ? estimateProgress(project) : 0;

    const reply: Message = {
      id: generateId(),
      projectId,
      role: 'assistant',
      content: `已记录进展 ✓ 进度 ${progress}%`,
      type: 'suggestion',
      metadata: { progressAfter: progress },
      timestamp: timestamp + 1,
    };
    storageAddMessage(reply);
    refresh();
  }, [data.projects, refresh]);

  // ---- Thought CRUD ----

  const addThought = useCallback((content: string, color?: ThoughtColor) => {
    const thought: Thought = {
      id: generateId(),
      content,
      color: color ?? null,
      createdAt: Date.now(),
      processed: false,
    };
    storageAddThought(thought);
    refresh();
  }, [refresh]);

  const updateThought = useCallback((id: string, updates: Partial<Thought>) => {
    storageUpdateThought(id, updates);
    refresh();
  }, [refresh]);

  const deleteThought = useCallback((id: string) => {
    storageDeleteThought(id);
    refresh();
  }, [refresh]);

  // ---- ThoughtNote CRUD ----

  const addThoughtNote = useCallback((thoughtId: string, content: string) => {
    const note: ThoughtNote = {
      id: generateId(),
      thoughtId,
      content,
      createdAt: Date.now(),
    };
    storageAddThoughtNote(note);
    refresh();
  }, [refresh]);

  const updateThoughtNote = useCallback((id: string, updates: Partial<ThoughtNote>) => {
    storageUpdateThoughtNote(id, updates);
    refresh();
  }, [refresh]);

  const deleteThoughtNote = useCallback((id: string) => {
    storageDeleteThoughtNote(id);
    refresh();
  }, [refresh]);

  // ---- Task CRUD ----

  const addTask = useCallback((task: Task) => {
    storageAddTask(task);
    refresh();
  }, [refresh]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    storageUpdateTask(id, updates);
    refresh();
  }, [refresh]);

  const deleteTask = useCallback((id: string) => {
    storageDeleteTask(id);
    refresh();
  }, [refresh]);

  const toggleTask = useCallback((id: string) => {
    const d = getData();
    const task = d.tasks.find((t) => t.id === id);
    if (task) {
      storageUpdateTask(id, { completed: !task.completed });
      refresh();
    }
  }, [refresh]);

  // ---- AI Organization ----

  const organizeInbox = useCallback(async (): Promise<AIOrganizeResult | null> => {
    const d = getData();
    const unprocessed = d.thoughts.filter((t) => !t.processed);
    if (unprocessed.length === 0) return null;

    const result = await llmOrganizeInbox(unprocessed, d.projects);
    if (result) {
      const allIds = new Set([
        ...result.projectSuggestions.flatMap((s) => s.thoughtIds),
        ...result.extractedTasks.flatMap((t) => t.thoughtIds),
      ]);
      allIds.forEach((id) => storageUpdateThought(id, { processed: true }));
      refresh();
    }
    return result;
  }, [refresh]);

  const createProjectFromThoughts = useCallback(
    (name: string, thoughtIds: string[], urgency: Urgency = 'medium'): Project => {
      const project: Project = {
        id: generateId(),
        name,
        description: '',
        urgency,
        deadline: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completed: false,
        completedAt: null,
        manualProgress: null,
        pinned: false,
        lastMessagePreview: '',
        lastMessageAt: Date.now(),
        tasks: [],
        aiSummary: '',
      };

      storageAddProject(project);

      thoughtIds.forEach((tid) => {
        storageUpdateThought(tid, { projectId: project.id, processed: true });
      });

      refresh();
      return project;
    },
    [refresh],
  );

  const generateFocusGuidance = useCallback(async (): Promise<string | null> => {
    const d = getData();
    return llmGenerateFocusGuidance(d.thoughts, d.projects);
  }, []);

  const generateProjectGuidance = useCallback(async (projectId: string): Promise<string | null> => {
    const d = getData();
    const project = d.projects.find((p) => p.id === projectId);
    if (!project) return null;
    return llmGenerateProjectGuidance(project);
  }, []);

  // ---- Task Progress ----

  const getTaskProgressFn = useCallback((projectId: string) => {
    const d = getData();
    const project = d.projects.find((p) => p.id === projectId);
    if (!project) return 0;
    return getTaskProgress(project);
  }, [version]);

  // ---- Reset ----

  const resetAll = useCallback(() => {
    resetData();
    refresh();
  }, [refresh]);

  // ---- Legacy progress ----

  const getProgress = useCallback((projectId: string) => {
    const project = getData().projects.find((p) => p.id === projectId);
    if (!project) return 0;
    return estimateProgress(project);
  }, [version]);

  return (
    <AppContext.Provider
      value={{
        data,
        refresh,
        addProject,
        updateProject,
        deleteProject,
        toggleComplete,
        addMessage,
        deleteMessage,
        sendMessage,
        resetAll,
        smartTasks,
        getProgress,
        addThought,
        updateThought,
        deleteThought,
        addThoughtNote,
        updateThoughtNote,
        deleteThoughtNote,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        organizeInbox,
        createProjectFromThoughts,
        generateFocusGuidance,
        generateProjectGuidance,
        getTaskProgress: getTaskProgressFn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
