import type { AppData, Project, ProgressLog } from './types';

const STORAGE_KEY = 'momenta_data_v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
    }
  } catch {
    // ignore
  }
  // Seed with demo data on first load
  const seeded = seedDemoData();
  saveData(seeded);
  return seeded;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- CRUD Operations ----

let _data: AppData | null = null;

export function getData(): AppData {
  if (!_data) {
    _data = loadData();
  }
  return _data;
}

export function flushData(): void {
  if (_data) {
    saveData(_data);
  }
}

function touch() {
  flushData();
}

export function addProject(project: Project): void {
  const d = getData();
  d.projects.push(project);
  touch();
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const d = getData();
  const idx = d.projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    d.projects[idx] = { ...d.projects[idx], ...updates, updatedAt: Date.now() };
    touch();
  }
}

export function deleteProject(id: string): void {
  const d = getData();
  d.projects = d.projects.filter((p) => p.id !== id);
  d.logs = d.logs.filter((l) => l.projectId !== id);
  touch();
}

export function toggleProjectComplete(id: string): void {
  const d = getData();
  const p = d.projects.find((p) => p.id === id);
  if (p) {
    p.completed = !p.completed;
    p.completedAt = p.completed ? Date.now() : null;
    p.updatedAt = Date.now();
    touch();
  }
}

export function addLog(log: ProgressLog): void {
  const d = getData();
  d.logs.push(log);
  // Also update project's updatedAt
  const p = d.projects.find((pr) => pr.id === log.projectId);
  if (p) {
    p.updatedAt = Date.now();
  }
  touch();
}

export function deleteLog(id: string): void {
  const d = getData();
  d.logs = d.logs.filter((l) => l.id !== id);
  touch();
}

export function getLogsForProject(projectId: string): ProgressLog[] {
  return getData()
    .logs.filter((l) => l.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getProjectById(id: string): Project | undefined {
  return getData().projects.find((p) => p.id === id);
}

function seedDemoData(): AppData {
  const now = Date.now();
  const day = 86400000;

  const projects: Project[] = [
    {
      id: 'demo-1',
      name: 'Q3 产品改版',
      description: '对主站首页和用户中心进行全面视觉改版',
      urgency: 'high',
      deadline: new Date(now + 14 * day).toISOString().split('T')[0],
      createdAt: now - 30 * day,
      updatedAt: now - 2 * day,
      completed: false,
      completedAt: null,
      manualProgress: null,
    },
    {
      id: 'demo-2',
      name: '品牌手册设计',
      description: '整理品牌视觉规范，制作可交付的品牌手册文档',
      urgency: 'medium',
      deadline: new Date(now + 30 * day).toISOString().split('T')[0],
      createdAt: now - 15 * day,
      updatedAt: now - 7 * day,
      completed: false,
      completedAt: null,
      manualProgress: null,
    },
    {
      id: 'demo-3',
      name: '客户提案：新能源项目',
      description: '为新能源客户制作品牌策略提案',
      urgency: 'critical',
      deadline: new Date(now + 5 * day).toISOString().split('T')[0],
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
      completed: false,
      completedAt: null,
      manualProgress: null,
    },
  ];

  const logs: ProgressLog[] = [
    { id: 'log-1', projectId: 'demo-1', content: '完成了首页线框图的初稿，和客户确认了信息架构', timestamp: now - 20 * day },
    { id: 'log-2', projectId: 'demo-1', content: '视觉风格探索做了3个方向，内部评审后确定了方案B', timestamp: now - 15 * day },
    { id: 'log-3', projectId: 'demo-1', content: '首页首屏的高保真设计稿完成，等待开发评审', timestamp: now - 10 * day },
    { id: 'log-4', projectId: 'demo-1', content: '根据开发反馈调整了部分交互细节', timestamp: now - 5 * day },
    { id: 'log-5', projectId: 'demo-1', content: '用户中心页面的设计进行中，完成了个人信息模块', timestamp: now - 2 * day },
    { id: 'log-6', projectId: 'demo-2', content: '整理了现有的品牌素材和过往设计文件', timestamp: now - 14 * day },
    { id: 'log-7', projectId: 'demo-2', content: '确定了品牌手册的大纲结构和章节划分', timestamp: now - 10 * day },
    { id: 'log-8', projectId: 'demo-2', content: '完成了色彩规范和字体规范章节', timestamp: now - 7 * day },
    { id: 'log-9', projectId: 'demo-3', content: '和客户进行了初步需求沟通，了解了品牌背景', timestamp: now - 4 * day },
    { id: 'log-10', projectId: 'demo-3', content: '完成了竞品分析和市场洞察报告', timestamp: now - 1 * day },
  ];

  return { projects, logs };
}

export function resetData(): void {
  const seeded = seedDemoData();
  _data = seeded;
  saveData(seeded);
}
