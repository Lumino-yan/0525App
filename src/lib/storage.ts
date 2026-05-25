import type { AppData, Project, Message } from './types';
import { generateId } from './engine';

const STORAGE_KEY = 'momenta_data_v2';
const OLD_STORAGE_KEY = 'momenta_data_v1';

// ---- Migration from v1 ----

interface OldProgressLog {
  id: string;
  projectId: string;
  content: string;
  timestamp: number;
}

interface OldAppData {
  projects: Project[];
  logs: OldProgressLog[];
}

function migrateFromV1(): AppData | null {
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as OldAppData;

    const messages: Message[] = old.logs.map((log) => ({
      id: log.id,
      projectId: log.projectId,
      role: 'user' as const,
      content: log.content,
      type: 'log' as const,
      timestamp: log.timestamp,
    }));

    const projects: Project[] = old.projects.map((p) => {
      const projectMessages = messages
        .filter((m) => m.projectId === p.id)
        .sort((a, b) => b.timestamp - a.timestamp);
      const lastMsg = projectMessages[0];
      return {
        ...p,
        pinned: false,
        lastMessagePreview: lastMsg?.content ?? p.description,
        lastMessageAt: lastMsg?.timestamp ?? p.updatedAt,
      };
    });

    const newData: AppData = { projects, messages };
    saveData(newData);
    return newData;
  } catch {
    return null;
  }
}

// ---- Core ----

export function loadData(): AppData {
  const migrated = migrateFromV1();
  if (migrated) return migrated;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch { /* ignore */ }

  const seeded = seedDemoData();
  saveData(seeded);
  return seeded;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- In-memory cache ----

let _data: AppData | null = null;

export function getData(): AppData {
  if (!_data) _data = loadData();
  return _data;
}

export function flushData(): void {
  if (_data) saveData(_data);
}

function touch() {
  flushData();
}

// ---- Project CRUD ----

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
  d.messages = d.messages.filter((m) => m.projectId !== id);
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

// ---- Message CRUD ----

export function addMessage(message: Message): void {
  const d = getData();
  d.messages.push(message);

  const p = d.projects.find((pr) => pr.id === message.projectId);
  if (p) {
    p.updatedAt = Date.now();
    p.lastMessagePreview = message.content.slice(0, 50);
    p.lastMessageAt = message.timestamp;
  }
  touch();
}

export function deleteMessage(id: string): void {
  const d = getData();
  d.messages = d.messages.filter((m) => m.id !== id);
  touch();
}

export function getMessagesForProject(projectId: string): Message[] {
  return getData()
    .messages.filter((m) => m.projectId === projectId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getProjectById(id: string): Project | undefined {
  return getData().projects.find((p) => p.id === id);
}

// ---- Seed Demo Data ----

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
      pinned: false,
      lastMessagePreview: '已5天未更新，建议推进首页设计',
      lastMessageAt: now - 2 * day,
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
      pinned: false,
      lastMessagePreview: '持续跟进中',
      lastMessageAt: now - 7 * day,
    },
    {
      id: 'demo-3',
      name: '客户提案：新能源项目',
      description: '为新能源客户制作品牌策略提案',
      urgency: 'critical',
      deadline: new Date(now + 3 * day).toISOString().split('T')[0],
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
      completed: false,
      completedAt: null,
      manualProgress: null,
      pinned: false,
      lastMessagePreview: '3天后截止，建议优先处理',
      lastMessageAt: now - 1 * day,
    },
  ];

  const messages: Message[] = [
    { id: 'msg-1', projectId: 'demo-1', role: 'user', content: '完成了首页线框图的初稿，和客户确认了信息架构', type: 'log', timestamp: now - 20 * day },
    { id: 'msg-2', projectId: 'demo-1', role: 'assistant', content: '已记录进展 ✓ 进度 15%\n\n首页线框图确认后，建议下一步做视觉风格探索，确定设计方向。', type: 'suggestion', timestamp: now - 20 * day + 1000 },
    { id: 'msg-3', projectId: 'demo-1', role: 'user', content: '视觉风格探索做了3个方向，内部评审后确定了方案B', type: 'log', timestamp: now - 15 * day },
    { id: 'msg-4', projectId: 'demo-1', role: 'assistant', content: '已记录进展 ✓ 进度 25%\n\n方案B确认，可以开始首页首屏的高保真设计了。', type: 'suggestion', timestamp: now - 15 * day + 1000 },
    { id: 'msg-5', projectId: 'demo-1', role: 'user', content: '首页首屏的高保真设计稿完成，等待开发评审', type: 'log', timestamp: now - 10 * day },
    { id: 'msg-6', projectId: 'demo-1', role: 'user', content: '根据开发反馈调整了部分交互细节', type: 'log', timestamp: now - 5 * day },
    { id: 'msg-7', projectId: 'demo-1', role: 'user', content: '用户中心页面的设计进行中，完成了个人信息模块', type: 'log', timestamp: now - 2 * day },
    { id: 'msg-8', projectId: 'demo-1', role: 'system', content: '⚠️ Q3产品改版已经5天没有更新了。建议今天推进用户中心页面设计。', type: 'alert', timestamp: now - 1 * day },
    { id: 'msg-9', projectId: 'demo-2', role: 'user', content: '整理了现有的品牌素材和过往设计文件', type: 'log', timestamp: now - 14 * day },
    { id: 'msg-10', projectId: 'demo-2', role: 'assistant', content: '已记录进展 ✓ 进度 10%\n\n素材整理是品牌手册的第一步，下一步确定手册大纲结构。', type: 'suggestion', timestamp: now - 14 * day + 1000 },
    { id: 'msg-11', projectId: 'demo-2', role: 'user', content: '确定了品牌手册的大纲结构和章节划分', type: 'log', timestamp: now - 10 * day },
    { id: 'msg-12', projectId: 'demo-2', role: 'user', content: '完成了色彩规范和字体规范章节', type: 'log', timestamp: now - 7 * day },
    { id: 'msg-13', projectId: 'demo-3', role: 'user', content: '和客户进行了初步需求沟通，了解了品牌背景', type: 'log', timestamp: now - 4 * day },
    { id: 'msg-14', projectId: 'demo-3', role: 'user', content: '完成了竞品分析和市场洞察报告', type: 'log', timestamp: now - 1 * day },
    { id: 'msg-15', projectId: 'demo-3', role: 'system', content: '⚡ 客户提案还剩3天截止！目前完成了初步调研和竞品分析，建议今天开始策略框架的撰写。', type: 'alert', timestamp: now },
  ];

  return { projects, messages };
}

export function resetData(): void {
  const seeded = seedDemoData();
  _data = seeded;
  saveData(seeded);
}
