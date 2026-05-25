import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AppData, Project, ProgressLog } from '../lib/types';
import {
  getData,
  addProject as storageAddProject,
  updateProject as storageUpdateProject,
  deleteProject as storageDeleteProject,
  toggleProjectComplete as storageToggleComplete,
  addLog as storageAddLog,
  deleteLog as storageDeleteLog,
  resetData,
} from '../lib/storage';
import { generateSmartTasks, estimateProgress } from '../lib/engine';
import type { SmartTask } from '../lib/types';

interface AppContextValue {
  data: AppData;
  refresh: () => void;
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleComplete: (id: string) => void;
  addLog: (log: ProgressLog) => void;
  deleteLog: (id: string) => void;
  resetAll: () => void;
  smartTasks: SmartTask[];
  getProgress: (projectId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  // Load data from storage
  const data = getData();

  // Derive smart tasks
  const smartTasks = generateSmartTasks(data.projects);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

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

  const addLog = useCallback((log: ProgressLog) => {
    storageAddLog(log);
    refresh();
  }, [refresh]);

  const deleteLog = useCallback((id: string) => {
    storageDeleteLog(id);
    refresh();
  }, [refresh]);

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
        addLog,
        deleteLog,
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
