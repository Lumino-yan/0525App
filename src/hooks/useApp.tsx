import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AppData, Project, Message } from '../lib/types';
import {
  getData,
  addProject as storageAddProject,
  updateProject as storageUpdateProject,
  deleteProject as storageDeleteProject,
  toggleProjectComplete as storageToggleComplete,
  addMessage as storageAddMessage,
  deleteMessage as storageDeleteMessage,
  resetData,
} from '../lib/storage';
import { generateSmartTasks, estimateProgress, generateId } from '../lib/engine';
import { parseMessage as llmParse, hasApiKey } from '../lib/llmService';
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

  // Check for stale projects on app open and generate system alerts
  useEffect(() => {
    const now = Date.now();
    const DAY = 86400000;

    smartTasks
      .filter((t) => t.urgency === 'now')
      .forEach((task) => {
        const projectMessages = data.messages.filter(
          (m) => m.projectId === task.project.id && m.type === 'alert'
        );
        const lastAlertToday = projectMessages.some(
          (m) => now - m.timestamp < DAY
        );
        if (!lastAlertToday) {
          const icon = task.project.urgency === 'critical' ? '⚡' : '⚠️';
          const alertMsg: Message = {
            id: generateId(),
            projectId: task.project.id,
            role: 'system',
            content: `${icon} ${task.reason}。建议：${task.suggestedAction}`,
            type: 'alert',
            timestamp: now,
          };
          storageAddMessage(alertMsg);
        }
      });
    refresh();
  }, []); // Run once on mount

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

    // 1. Add user message (optimistic)
    const userMsg: Message = {
      id: generateId(),
      projectId,
      role: 'user',
      content,
      type: 'log',
      timestamp,
    };
    storageAddMessage(userMsg);

    // 2. Generate local optimistic reply
    const project = projectId ? data.projects.find((p) => p.id === projectId) : null;
    const progress = project ? estimateProgress(project) : 0;

    const optimisticReply: Message = {
      id: generateId(),
      projectId,
      role: 'assistant',
      content: `已记录进展 ✓ 进度 ${progress}%`,
      type: 'suggestion',
      metadata: { progressAfter: progress },
      timestamp: timestamp + 1,
    };
    storageAddMessage(optimisticReply);
    refresh();

    // 3. Call LLM for enriched reply (if API key available)
    if (hasApiKey()) {
      const llmResult = await llmParse(content, {
        projectId,
        project: project ?? null,
        isNewChat: !existingProjectId,
      });

      if (llmResult && llmResult.intent === 'log' && project) {
        // Delete optimistic reply, add LLM reply
        storageDeleteMessage(optimisticReply.id);
        const llmReply: Message = {
          id: generateId(),
          projectId,
          role: 'assistant',
          content: llmResult.reply,
          type: 'suggestion',
          metadata: {
            progressAfter: llmResult.extracted.progressEstimate ?? progress,
            parsedIntent: llmResult.intent,
          },
          timestamp: timestamp + 2,
        };
        storageAddMessage(llmReply);
        refresh();
      }
    }
  }, [data.projects, refresh]);

  const resetAll = useCallback(() => {
    resetData();
    refresh();
  }, [refresh]);

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
