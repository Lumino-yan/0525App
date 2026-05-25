# Momenta Chat Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Momenta from a tab-based todo app into a WeChat-like intelligent PM assistant with LLM-powered natural language interaction.

**Architecture:** Dual-layer message processing — local engine (`engine.ts`) provides immediate optimistic responses and smart ranking, LLM API (`llmService.ts`) provides deep natural language understanding. UI is a single-stack chat interface with 4 routes, no tab bar.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 3, shadcn/ui, Anthropic API, Capacitor (Android)

**Project Root:** `/Users/lumino/Projects/0525App`

**Design System:** Animal Crossing / NookPhone aesthetic — warm cream backgrounds, soft green accents, rounded cozy cards, playful friendly feel.

### Color Palette (MANDATORY for all components)

| Token | Tailwind Class / Hex | Usage |
|-------|---------------------|-------|
| Page BG | `bg-[#FFF8E1]` | All page backgrounds |
| Card BG | `bg-[#FFFBEF]` | Cards, bubbles, surfaces |
| Primary | `bg-[#9CCC65]` / `text-[#689F38]` | Buttons, accents, progress bars |
| User bubble | `bg-[#C8E6C9]` | User message bubbles |
| System bubble | `bg-[#FFFBEF]` | System/assistant message bubbles |
| Alert BG | `bg-[#FFECB3]` | Warning/alert system bubbles |
| Badge | `bg-[#EF9A9A]` | Red notification badges |
| Border | `border-[#E8D5B0]` | Subtle warm borders |
| Muted text | `text-[#8D6E63]` | Secondary text, timestamps |
| Dark text | `text-[#4E342E]` | Primary text |
| Header/footer BG | `bg-[#FFF8E1]` | Same as page bg |

### Design Rules
- Border radius: `rounded-2xl` for cards, `rounded-3xl` for bubbles
- Shadows: `shadow-sm`, warm low-elevation only
- No harsh pure black, no pure white, no fluorescent colors
- Everything feels warm, paper-like, cozy

---

## File Structure

```
src/
├── main.tsx                    ← keep
├── App.tsx                     ← MODIFY: new routing, no tab bar
├── App.css                     ← REWRITE: chat app styles
├── index.css                   ← keep
├── lib/
│   ├── types.ts                ← MODIFY: add Message, extend Project, remove ProgressLog
│   ├── engine.ts               ← MODIFY: adapt to Message[] instead of ProgressLog[]
│   ├── storage.ts              ← MODIFY: v2 format, migration, message CRUD
│   ├── llmService.ts           ← CREATE: Anthropic API integration
│   └── utils.ts                ← keep (shadcn utility)
├── hooks/
│   ├── useApp.tsx              ← MODIFY: updated context, LLM integration
│   └── use-mobile.ts           ← keep
├── pages/
│   ├── MessageListPage.tsx     ← CREATE
│   ├── ChatPage.tsx            ← CREATE
│   ├── NewChatPage.tsx         ← CREATE
│   └── SettingsPage.tsx        ← REWRITE: add API key management
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx      ← CREATE
│   │   ├── MessageBubble.tsx   ← CREATE
│   │   ├── SystemBubble.tsx    ← CREATE
│   │   ├── UserBubble.tsx      ← CREATE
│   │   └── ChatInput.tsx       ← CREATE
│   ├── list/
│   │   ├── ConversationRow.tsx ← CREATE
│   │   └── SearchBar.tsx       ← CREATE
│   ├── ui/                     ← keep (shadcn)
│   └── effects/                ← keep (animation components)
└── sections/                   ← DELETE all (old landing page)
```

**Files to DELETE:**
- `src/pages/Today.tsx`, `Projects.tsx`, `ProjectDetail.tsx`, `NewProject.tsx`, `AddLog.tsx`, `Home.tsx`
- `src/sections/` (entire directory — old landing page, not used by app)

---

### Task 1: Update Data Model (types.ts)

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/lib/types.ts`

- [ ] **Step 1: Rewrite types.ts with new data model**

Replace the entire file content:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | head -30`
Expected: Errors about missing exports in other files (engine.ts, storage.ts, useApp.tsx still reference old types). These will be fixed in subsequent tasks.

---

### Task 2: Update Storage Layer (storage.ts)

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/lib/storage.ts`

- [ ] **Step 1: Rewrite storage.ts with v2 format and migration**

```typescript
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

    // Convert old ProgressLog[] to Message[]
    const messages: Message[] = old.logs.map((log) => ({
      id: log.id,
      projectId: log.projectId,
      role: 'user' as const,
      content: log.content,
      type: 'log' as const,
      timestamp: log.timestamp,
    }));

    // Extend projects with new fields
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
  // Try migration first
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

function refreshCache() {
  _data = loadData();
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
    { id: 'msg-2', projectId: 'demo-1', role: 'assistant', content: '已记录进展 ✓ 进度 15%\n\n首页线框图确认后，建议下一步做视觉风格探索，确定设计方向。', type: 'suggestion', metadata: { progressBefore: 10, progressAfter: 15 }, timestamp: now - 20 * day + 1000 },
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
```

- [ ] **Step 2: Verify TypeScript compiles storage.ts in isolation**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/lib/storage.ts 2>&1 | head -20`
Expected: Should pass or only have errors about engine.ts imports.

---

### Task 3: Adapt Engine (engine.ts)

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/lib/engine.ts`

- [ ] **Step 1: Update engine.ts to use Message[] instead of ProgressLog[]**

Replace the relevant sections. The file keeps the same structure but changes `getLogsForProject` → `getMessagesForProject` and filters for `type: 'log'` messages for progress estimation.

```typescript
import type { Project, SmartTask, Urgency, Message } from './types';
import { getMessagesForProject } from './storage';

const DAY = 86400000;
const URGENCY_WEIGHT: Record<Urgency, number> = {
  low: 1,
  medium: 3,
  high: 6,
  critical: 10,
};

// ---- Auto Progress Estimation ----

export function getProgress(project: Project): number {
  return estimateProgress(project);
}

export function estimateProgress(project: Project): number {
  if (project.manualProgress !== null) {
    return project.manualProgress;
  }
  if (project.completed) return 100;

  const messages = getMessagesForProject(project.id);
  const logMessages = messages.filter((m) => m.type === 'log');
  const logCount = logMessages.length;

  if (logCount === 0) return 0;

  // Base progress from log count (diminishing returns)
  const logProgress = 100 * (1 - Math.exp(-logCount * 0.15));

  // Recency boost
  const now = Date.now();
  const mostRecentLog = logMessages[logMessages.length - 1];
  const daysSinceLastActivity = mostRecentLog
    ? (now - mostRecentLog.timestamp) / DAY
    : 999;
  const recencyMultiplier =
    daysSinceLastActivity < 1
      ? 1.15
      : daysSinceLastActivity < 3
        ? 1.05
        : daysSinceLastActivity < 7
          ? 1.0
          : daysSinceLastActivity < 14
            ? 0.9
            : 0.75;

  // Time pressure factor
  let deadlineProgress = 0;
  if (project.deadline) {
    const totalSpan = (new Date(project.deadline).getTime() + DAY - project.createdAt);
    const elapsed = now - project.createdAt;
    if (totalSpan > 0) {
      deadlineProgress = (elapsed / totalSpan) * 100;
    }
  }

  let finalProgress = logProgress * recencyMultiplier;

  if (deadlineProgress > 0) {
    const blend = 0.3;
    finalProgress = finalProgress * (1 - blend) + deadlineProgress * blend;
  }

  return Math.min(100, Math.max(0, Math.round(finalProgress)));
}

// ---- Smart Task Ranking ----

export function generateSmartTasks(projects: Project[]): SmartTask[] {
  const now = Date.now();

  const scored = projects
    .filter((p) => !p.completed)
    .map((project) => {
      const messages = getMessagesForProject(project.id);
      const logMessages = messages.filter((m) => m.type === 'log');
      const lastActivity =
        messages.length > 0
          ? messages[messages.length - 1].timestamp
          : project.createdAt;
      const daysSinceActivity = (now - lastActivity) / DAY;
      const logCount = logMessages.length;
      const progress = estimateProgress(project);

      // Score components (unchanged from original engine)
      const urgencyScore = URGENCY_WEIGHT[project.urgency];
      const stalenessScore = Math.min(10, daysSinceActivity * 0.8);

      let deadlineScore = 0;
      if (project.deadline) {
        const daysUntil = (new Date(project.deadline).getTime() - now) / DAY;
        if (daysUntil < 0) deadlineScore = 12;
        else if (daysUntil < 3) deadlineScore = 10;
        else if (daysUntil < 7) deadlineScore = 7;
        else if (daysUntil < 14) deadlineScore = 4;
        else deadlineScore = 1;
      } else {
        deadlineScore = 2;
      }

      const momentumScore = progress > 80 ? 3 : progress > 50 ? 1 : 0;
      const coldStartScore = logCount === 0 ? 5 : logCount < 3 ? 2 : 0;

      const priorityScore =
        urgencyScore * 2.0 +
        stalenessScore * 1.5 +
        deadlineScore * 1.8 +
        momentumScore * 0.8 +
        coldStartScore * 1.0;

      let urgency: 'now' | 'soon' | 'later' = 'later';
      if (priorityScore >= 25 || project.urgency === 'critical') {
        urgency = 'now';
      } else if (priorityScore >= 15 || project.urgency === 'high') {
        urgency = 'soon';
      }

      const reasons: string[] = [];
      if (project.urgency === 'critical') reasons.push('标记为紧急');
      else if (project.urgency === 'high') reasons.push('标记为高优先级');
      if (daysSinceActivity > 7) reasons.push(`${Math.round(daysSinceActivity)}天未更新`);
      else if (daysSinceActivity > 3) reasons.push(`${Math.round(daysSinceActivity)}天未更新`);
      if (project.deadline) {
        const daysUntil = Math.round((new Date(project.deadline).getTime() - now) / DAY);
        if (daysUntil < 0) reasons.push('已逾期');
        else if (daysUntil <= 3) reasons.push(`${daysUntil}天后截止`);
        else if (daysUntil <= 7) reasons.push(`${daysUntil}天后截止`);
      }
      if (logCount === 0) reasons.push('尚未开始');
      if (progress > 80) reasons.push('即将完成');

      const reason = reasons.length > 0 ? reasons.join(' · ') : '持续跟进中';

      let suggestedAction = '添加进展记录';
      if (logCount === 0) suggestedAction = '开始第一个任务';
      else if (progress > 80) suggestedAction = '收尾并完成';
      else if (daysSinceActivity > 7) suggestedAction = '恢复推进';
      else if (project.urgency === 'critical') suggestedAction = '优先处理';

      return {
        project,
        reason,
        priorityScore,
        suggestedAction,
        urgency,
      } satisfies SmartTask;
    });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored;
}

// ---- Utility ----

export function formatDate(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function formatFullDate(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  return Math.round((target - now) / DAY);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
```

- [ ] **Step 2: Verify TypeScript compiles for engine.ts**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | grep -i "engine" | head -10`
Expected: Engine-related errors should be resolved. Other files may still have errors.

---

### Task 4: Create LLM Service (llmService.ts)

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/lib/llmService.ts`

- [ ] **Step 1: Create llmService.ts**

```typescript
import type { Project, Message } from './types';
import { getMessagesForProject } from './storage';

const API_KEY_STORAGE_KEY = 'momenta_llm_api_key';

function getApiKey(): string {
  // Check localStorage override first, then fall back to build-time env var
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (stored) return stored;
  return import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

const SYSTEM_PROMPT = `你是 Momenta，一个智能项目管理助手。你的风格是主动、简洁、有帮助的，像一个经验丰富的项目经理。

当用户发消息时，你需要解析意图并返回 JSON。可能的意图：
- "log": 用户在记录项目进展
- "create": 用户想创建新项目
- "query": 用户在询问项目状态
- "unknown": 无法判断

返回格式必须是严格的 JSON（不要包含 markdown 标记）：
{
  "intent": "log" | "create" | "query" | "unknown",
  "confidence": 0.0-1.0,
  "extracted": {
    "projectName": "从消息中提取的项目名（仅 create 意图）",
    "urgency": "low" | "medium" | "high" | "critical" | null,
    "deadline": "ISO date string or null",
    "progressNote": "进展内容的简洁总结（仅 log 意图）",
    "suggestion": "对用户的下一步建议（仅 log 意图）",
    "progressEstimate": 0-100 的进度估算（仅 log 意图，可选）
  },
  "reply": "给用户的自然语言回复"
}`;

interface LLMResponse {
  intent: 'log' | 'create' | 'query' | 'unknown';
  confidence: number;
  extracted: {
    projectName?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical' | null;
    deadline?: string | null;
    progressNote?: string;
    suggestion?: string;
    progressEstimate?: number;
  };
  reply: string;
}

export async function parseMessage(
  content: string,
  context: {
    projectId?: string;
    project?: Project | null;
    isNewChat?: boolean;
  }
): Promise<LLMResponse | null> {
  if (!hasApiKey()) return null;

  const contextMessages = context.project
    ? getMessagesForProject(context.project.id).slice(-10)
    : [];

  const contextStr = context.project
    ? `当前项目：${context.project.name}
项目描述：${context.project.description}
优先级：${context.project.urgency}
截止日期：${context.project.deadline ?? '未设置'}
已完成：${context.project.completed ? '是' : '否'}
最近消息：${contextMessages.map((m) => `[${m.role}] ${m.content}`).join('\n')}`
    : '尚未创建项目';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `上下文：\n${contextStr}\n\n用户消息：${content}\n\n${
              context.isNewChat ? '注意：这是一个新项目创建场景，请用 create 意图解析。' : ''
            }`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('LLM API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as LLMResponse;
  } catch (err) {
    console.warn('LLM call failed:', err);
    return null;
  }
}

export async function generateProjectSummary(project: Project): Promise<string | null> {
  if (!hasApiKey()) return null;

  const messages = getMessagesForProject(project.id);
  const logMessages = messages.filter((m) => m.type === 'log');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: '你是一个项目管理助手。根据项目信息生成简洁的中文项目状态总结。',
        messages: [
          {
            role: 'user',
            content: `项目：${project.name}\n描述：${project.description}\n优先级：${project.urgency}\n截止日期：${project.deadline ?? '未设置'}\n进展记录：${logMessages.map((m) => m.content).join('；')}\n\n请用2-3句话总结当前项目状态。`,
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles for llmService.ts**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | grep "llmService" | head -10`
Expected: Should compile clean.

---

### Task 5: Update App Hook (useApp.tsx)

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/hooks/useApp.tsx`

- [ ] **Step 1: Rewrite useApp.tsx with new types and LLM integration**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | grep -v "sections/" | grep -v "pages/Today\|pages/Projects\|pages/ProjectDetail\|pages/NewProject\|pages/AddLog\|pages/Home" | head -20`
Expected: Only errors from old pages/sections that we'll delete later.

---

### Task 6: Create ChatHeader Component

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/components/chat/ChatHeader.tsx`

- [ ] **Step 1: Create ChatHeader.tsx**

```typescript
import { ArrowLeft } from 'lucide-react';
import type { Project } from '../../lib/types';

interface ChatHeaderProps {
  project: Project;
  progress: number;
  onBack: () => void;
}

export default function ChatHeader({ project, progress, onBack }: ChatHeaderProps) {
  const progressColor =
    progress >= 80
      ? 'bg-green-500'
      : progress >= 40
        ? 'bg-violet-500'
        : 'bg-amber-500';

  return (
    <div className="sticky top-0 z-30 bg-[#ededed] border-b border-neutral-200">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-200/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-700" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-neutral-900 truncate">{project.name}</h1>
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[80px] h-1.5 bg-neutral-300 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/components/chat/ChatHeader.tsx 2>&1`
Expected: No errors.

---

### Task 7: Create ChatInput Component

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/components/chat/ChatInput.tsx`

- [ ] **Step 1: Create ChatInput.tsx**

```typescript
import { useState, useRef, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 bg-[#f5f5f5] px-3 py-2 border-t border-neutral-200">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="记录进展..."
          disabled={disabled}
          className="flex-1 h-9 px-4 bg-white border border-neutral-300 rounded-full text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/components/chat/ChatInput.tsx 2>&1`
Expected: No errors.

---

### Task 8: Create Message Bubble Components

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/components/chat/SystemBubble.tsx`
- Create: `/Users/lumino/Projects/0525App/src/components/chat/UserBubble.tsx`
- Create: `/Users/lumino/Projects/0525App/src/components/chat/MessageBubble.tsx`

- [ ] **Step 1: Create SystemBubble.tsx**

```typescript
import type { Message } from '../../lib/types';
import { formatDate } from '../../lib/engine';

interface SystemBubbleProps {
  message: Message;
}

export default function SystemBubble({ message }: SystemBubbleProps) {
  const isAlert = message.type === 'alert';
  const isSuggestion = message.type === 'suggestion';

  return (
    <div className="flex gap-2 items-start max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">
        M
      </div>
      <div>
        <div
          className={`px-3 py-2.5 rounded-xl text-[13px] leading-relaxed ${
            isAlert
              ? 'bg-amber-50 text-amber-900 rounded-tl-sm'
              : isSuggestion
                ? 'bg-white text-neutral-800 rounded-tl-sm'
                : 'bg-white text-neutral-800 rounded-tl-sm'
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {message.content}
        </div>
        <div className="text-[10px] text-neutral-400 mt-1 ml-1">
          {formatDate(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create UserBubble.tsx**

```typescript
import type { Message } from '../../lib/types';

interface UserBubbleProps {
  message: Message;
}

export default function UserBubble({ message }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[82%]">
        <div className="bg-[#95ec69] px-3 py-2.5 rounded-xl rounded-tr-sm text-[13px] text-black leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create MessageBubble.tsx (dispatcher)**

```typescript
import type { Message } from '../../lib/types';
import SystemBubble from './SystemBubble';
import UserBubble from './UserBubble';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }
  return <SystemBubble message={message} />;
}
```

- [ ] **Step 4: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/components/chat/MessageBubble.tsx 2>&1`
Expected: No errors.

---

### Task 9: Create List Components

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/components/list/ConversationRow.tsx`
- Create: `/Users/lumino/Projects/0525App/src/components/list/SearchBar.tsx`

- [ ] **Step 1: Create ConversationRow.tsx**

```typescript
import type { Project } from '../../lib/types';
import { formatDate } from '../../lib/engine';

interface ConversationRowProps {
  project: Project;
  progress: number;
  alertCount: number;
  onClick: () => void;
}

export default function ConversationRow({ project, progress, alertCount, onClick }: ConversationRowProps) {
  const avatarChar = project.name.charAt(0);
  const progressColor =
    progress >= 80
      ? 'from-green-500 to-emerald-400'
      : progress >= 40
        ? 'from-violet-500 to-purple-400'
        : 'from-amber-500 to-orange-400';

  return (
    <div
      className="bg-white cursor-pointer active:bg-neutral-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${progressColor} flex items-center justify-center text-white font-bold text-base shrink-0`}>
          {avatarChar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[15px] font-medium text-neutral-900 truncate">
              {project.name}
            </span>
            <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
              {formatDate(project.lastMessageAt)}
            </span>
          </div>

          <p className="text-[12px] text-neutral-500 truncate mb-1.5">
            {project.lastMessagePreview}
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Badge */}
        {alertCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {alertCount}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SearchBar.tsx**

```typescript
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative px-4 py-2">
      <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        placeholder="搜索项目..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-8 pr-3 bg-neutral-100 rounded-lg text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/components/list/ConversationRow.tsx 2>&1`
Expected: No errors.

---

### Task 10: Create MessageListPage

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/pages/MessageListPage.tsx`

- [ ] **Step 1: Create MessageListPage.tsx**

```typescript
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { Plus, Settings } from 'lucide-react';
import ConversationRow from '../components/list/ConversationRow';
import SearchBar from '../components/list/SearchBar';

export default function MessageListPage() {
  const { data, smartTasks, getProgress } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Sort projects by smart priority
  const sortedProjects = useMemo(() => {
    const active = data.projects.filter((p) => !p.completed);
    const completed = data.projects.filter((p) => p.completed);

    // Active projects sorted by smart ranking
    const rankedIds = new Map(
      smartTasks.map((t, i) => [t.project.id, i])
    );

    const sorted = [...active].sort((a, b) => {
      const rankA = rankedIds.get(a.id) ?? 999;
      const rankB = rankedIds.get(b.id) ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      // Pinned projects float to top within same rank
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastMessageAt - a.lastMessageAt;
    });

    return [...sorted, ...completed];
  }, [data.projects, smartTasks]);

  const filtered = sortedProjects.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  // Alert count = number of unread system alerts (simplified: count alerts from today)
  const today = Date.now() - 86400000;
  const getAlertCount = (projectId: string) =>
    data.messages.filter(
      (m) => m.projectId === projectId && m.type === 'alert' && m.timestamp > today
    ).length;

  const totalAlerts = data.messages.filter(
    (m) => m.type === 'alert' && m.timestamp > today
  ).length;

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#ededed] px-4 pt-3 pb-1 flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold text-neutral-900">Momenta</h1>
          {totalAlerts > 0 && (
            <p className="text-[11px] text-red-500 font-medium">
              {totalAlerts} 个项目需要关注
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200/60 transition-colors"
          >
            <Settings size={18} className="text-neutral-600" />
          </button>
          <button
            onClick={() => navigate('/new-chat')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200/60 transition-colors"
          >
            <Plus size={22} className="text-violet-600" />
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {/* List */}
      <div className="bg-white rounded-t-2xl min-h-full">
        {filtered.map((project) => (
          <ConversationRow
            key={project.id}
            project={project}
            progress={getProgress(project.id)}
            alertCount={getAlertCount(project.id)}
            onClick={() => navigate(`/chat/${project.id}`)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
              <Plus size={24} className="text-violet-400" />
            </div>
            <p className="text-sm text-neutral-500 mb-4 text-center">
              {search ? '没有找到匹配的项目' : '还没有项目，点击右上角 + 创建'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/new-chat')}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg"
              >
                创建第一个项目
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles for new page**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/pages/MessageListPage.tsx 2>&1`
Expected: No errors.

---

### Task 11: Create ChatPage

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/pages/ChatPage.tsx`

- [ ] **Step 1: Create ChatPage.tsx**

```typescript
import { useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getProjectById, getMessagesForProject } from '../lib/storage';
import { deleteProject } from '../lib/storage';
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sendMessage, getProgress, refresh } = useApp();
  const [sending, setSending] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const project = id ? getProjectById(id) : undefined;
  const messages = id ? getMessagesForProject(id) : [];
  const progress = project ? getProgress(project.id) : 0;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = useCallback(async (content: string) => {
    if (!id || sending) return;
    setSending(true);
    try {
      await sendMessage(content, id);
    } finally {
      setSending(false);
    }
  }, [id, sendMessage, sending]);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ededed]">
        <p className="text-neutral-500 mb-3">项目不存在</p>
        <button onClick={() => navigate('/')} className="text-violet-600 text-sm font-medium">
          返回消息列表
        </button>
      </div>
    );
  }

  function handleDelete() {
    if (!id) return;
    deleteProject(id);
    navigate('/');
  }

  // Group messages by date
  const groupedMessages: { date: string; items: typeof messages }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const dateKey = new Date(msg.timestamp).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
    });
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({ date: dateKey, items: [] });
    }
    groupedMessages[groupedMessages.length - 1].items.push(msg);
  }

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto flex flex-col">
      <ChatHeader
        project={project}
        progress={progress}
        onBack={() => navigate('/')}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            <div className="text-center mb-3">
              <span className="text-[10px] text-neutral-400 bg-[#ededed] px-3 py-0.5 rounded-full">
                {group.date}
              </span>
            </div>
            {group.items.map((msg) => (
              <div key={msg.id} className="mb-2">
                <MessageBubble message={msg} />
              </div>
            ))}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-neutral-400">还没有消息，开始记录进展吧</p>
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="shrink-0 pb-1 text-center">
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="text-[11px] text-neutral-300 hover:text-red-400 transition-colors py-1"
          >
            <Trash2 size={12} className="inline mr-1" />
            删除项目
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <button
              onClick={handleDelete}
              className="text-[11px] text-red-500 font-medium"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="text-[11px] text-neutral-400"
            >
              取消
            </button>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/pages/ChatPage.tsx 2>&1`
Expected: No errors.

---

### Task 12: Create NewChatPage

**Files:**
- Create: `/Users/lumino/Projects/0525App/src/pages/NewChatPage.tsx`

- [ ] **Step 1: Create NewChatPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { generateId } from '../lib/engine';
import { parseMessage as llmParse, hasApiKey } from '../lib/llmService';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import type { Message, Project, Urgency } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

export default function NewChatPage() {
  const navigate = useNavigate();
  const { addProject, addMessage, refresh } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      projectId: '',
      role: 'assistant',
      content:
        '你好！告诉我你想创建什么项目，我会自动帮你设置好。\n\n比如你可以说：\n"Q3产品改版，下周五截止，很急"\n\n或者简单说：\n"帮我做一个品牌手册"',
      type: 'suggestion',
      timestamp: Date.now(),
    },
  ]);
  const [sending, setSending] = useState(false);

  async function handleSend(content: string) {
    if (sending) return;
    setSending(true);

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      projectId: '',
      role: 'user',
      content,
      type: 'create',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (hasApiKey()) {
      // Call LLM to extract project info
      const result = await llmParse(content, { isNewChat: true });

      if (result && result.intent === 'create') {
        const project: Project = {
          id: generateId(),
          name: result.extracted.projectName ?? content.slice(0, 20),
          description: content,
          urgency: (result.extracted.urgency as Urgency) ?? 'medium',
          deadline: result.extracted.deadline ?? null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completed: false,
          completedAt: null,
          manualProgress: null,
          pinned: false,
          lastMessagePreview: '项目已创建',
          lastMessageAt: Date.now(),
        };

        addProject(project);

        const confirmMsg: Message = {
          id: generateId(),
          projectId: project.id,
          role: 'assistant',
          content: result.reply,
          type: 'create',
          timestamp: Date.now() + 1,
        };
        addMessage(confirmMsg);

        const proactiveMsg: Message = {
          id: generateId(),
          projectId: project.id,
          role: 'assistant',
          content: '项目已创建！建议从第一步开始：可以先梳理需求或做初步调研。随时在这里记录你的进展。',
          type: 'suggestion',
          timestamp: Date.now() + 2,
        };
        addMessage(proactiveMsg);

        refresh();
        navigate(`/chat/${project.id}`);
        return;
      }
    }

    // Fallback: create project with basic parsing
    const project: Project = {
      id: generateId(),
      name: content.slice(0, 30),
      description: content,
      urgency: 'medium',
      deadline: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completed: false,
      completedAt: null,
      manualProgress: null,
      pinned: false,
      lastMessagePreview: '项目已创建',
      lastMessageAt: Date.now(),
    };

    addProject(project);

    const confirmMsg: Message = {
      id: generateId(),
      projectId: project.id,
      role: 'assistant',
      content: `已创建项目「${project.name}」\n\n你可以直接在聊天里记录进展，我会自动跟踪进度。建议现在就开始：说说你第一步打算做什么？`,
      type: 'create',
      timestamp: Date.now() + 1,
    };
    addMessage(confirmMsg);

    refresh();
    navigate(`/chat/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-[#ededed] border-b border-neutral-200 px-3 py-2.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-200/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-700" />
        </button>
        <span className="text-[15px] font-semibold text-neutral-900">新建项目</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/pages/NewChatPage.tsx 2>&1`
Expected: No errors.

---

### Task 13: Rewrite SettingsPage

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Rewrite SettingsPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { resetData } from '../lib/storage';
import { setApiKey, getStoredApiKey } from '../lib/llmService';
import { ArrowLeft, Trash2, RotateCcw, Key, Info, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data, resetAll } = useApp();
  const [apiKey, setApiKeyState] = useState(getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const activeProjects = data.projects.filter((p) => !p.completed).length;
  const completedProjects = data.projects.filter((p) => p.completed).length;
  const totalMessages = data.messages.length;

  function handleSaveKey() {
    setApiKey(apiKey.trim());
  }

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="bg-[#ededed] border-b border-neutral-200 px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-200/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-700" />
        </button>
        <span className="text-[15px] font-semibold text-neutral-900">设置</span>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* API Key */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-neutral-700">Anthropic API Key</h3>
          </div>
          <p className="text-[11px] text-neutral-400 mb-3">
            用于自然语言解析和智能建议。不设置也能使用基础功能。
          </p>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 h-9 px-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-2 h-9 text-[10px] text-neutral-400 hover:text-neutral-600"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
            <button
              onClick={handleSaveKey}
              className="px-3 h-9 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700"
            >
              保存
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">数据概览</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{activeProjects}</div>
              <div className="text-[11px] text-neutral-400">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{completedProjects}</div>
              <div className="text-[11px] text-neutral-400">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-700">{totalMessages}</div>
              <div className="text-[11px] text-neutral-400">消息</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <span className="text-lg font-extrabold text-violet-600">M</span>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm">瞬目纪 MOMENTA</h3>
              <p className="text-[11px] text-neutral-400">v2.0 · 智能项目管理助手</p>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
            MOMENTA 是你的智能项目管理伙伴。像聊天一样记录进展，系统自动追踪项目进度，
            并在合适的时机主动提醒你。支持自然语言输入，你可以用说话的方式管理所有项目。
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">工作原理</h3>
          <div className="space-y-3">
            {[
              { title: '自然语言交互', desc: '用日常语言描述你的进展，AI 自动解析并更新项目状态' },
              { title: '智能优先级排序', desc: '综合紧急度、截止日期、更新频率，推荐你最该处理的项目' },
              { title: '本地存储', desc: '所有数据保存在设备本地，API Key 仅用于 AI 解析' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <Info size={14} className="text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-neutral-700">{item.title}</div>
                  <div className="text-[11px] text-neutral-400 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">危险区域</h3>

          <button
            onClick={() => setShowReset(true)}
            className="w-full bg-white rounded-xl p-3.5 flex items-center gap-3 text-left hover:bg-neutral-50 transition-colors"
          >
            <RotateCcw size={15} className="text-amber-500" />
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-700">重置为示例数据</div>
              <div className="text-[10px] text-neutral-400">恢复初始演示数据</div>
            </div>
            <ChevronRight size={13} className="text-neutral-300" />
          </button>

          <button
            onClick={() => setShowClear(true)}
            className="w-full bg-white rounded-xl p-3.5 flex items-center gap-3 text-left hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} className="text-red-400" />
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-700">清除所有数据</div>
              <div className="text-[10px] text-neutral-400">删除所有项目和记录，不可恢复</div>
            </div>
            <ChevronRight size={13} className="text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setShowReset(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={18} className="text-amber-500" />
              <h3 className="font-semibold text-neutral-900">重置数据</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">删除当前数据并恢复示例项目。此操作不可撤销。</p>
            <div className="flex gap-2">
              <button
                onClick={() => { resetAll(); setShowReset(false); }}
                className="flex-1 h-10 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600"
              >
                确认重置
              </button>
              <button onClick={() => setShowReset(false)} className="flex-1 h-10 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-xl">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Modal */}
      {showClear && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setShowClear(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={18} className="text-red-500" />
              <h3 className="font-semibold text-neutral-900">清除所有数据</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">永久删除所有项目和消息。此操作不可撤销。</p>
            <div className="flex gap-2">
              <button
                onClick={() => { resetData(); window.location.reload(); }}
                className="flex-1 h-10 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600"
              >
                确认删除
              </button>
              <button onClick={() => setShowClear(false)} className="flex-1 h-10 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-xl">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit src/pages/SettingsPage.tsx 2>&1`
Expected: No errors.

---

### Task 14: Update App.tsx (Routing) and App.css

**Files:**
- Modify: `/Users/lumino/Projects/0525App/src/App.tsx`
- Modify: `/Users/lumino/Projects/0525App/src/App.css`

- [ ] **Step 1: Rewrite App.tsx with new routing**

```typescript
import { Routes, Route } from 'react-router';
import { AppProvider } from './hooks/useApp';
import MessageListPage from './pages/MessageListPage';
import ChatPage from './pages/ChatPage';
import NewChatPage from './pages/NewChatPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto relative shadow-2xl shadow-neutral-200/20">
        <Routes>
          <Route path="/" element={<MessageListPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/new-chat" element={<NewChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}
```

- [ ] **Step 2: Rewrite App.css with chat app styles**

```css
/* Momenta — Chat App Styles */

/* Smooth scroll for message list */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* Message bubble animations */
@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-message-in {
  animation: messageIn 0.2s ease-out;
}

/* Hide scrollbar but keep scroll */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Card shadow utility */
.card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
}
```

- [ ] **Step 3: Verify full TypeScript compilation**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | grep -v "sections/" | grep -v "pages/Today\|pages/Projects\|pages/ProjectDetail\|pages/NewProject\|pages/AddLog\|pages/Home" | head -20`
Expected: Only errors from old pages/sections that we'll delete next. No errors from new code.

---

### Task 15: Delete Old Files

**Files:**
- Delete old pages and sections

- [ ] **Step 1: Remove old page files and sections**

```bash
cd /Users/lumino/Projects/0525App
rm -f src/pages/Today.tsx
rm -f src/pages/Projects.tsx
rm -f src/pages/ProjectDetail.tsx
rm -f src/pages/NewProject.tsx
rm -f src/pages/AddLog.tsx
rm -f src/pages/Home.tsx
rm -rf src/sections
```

- [ ] **Step 2: Verify clean TypeScript compilation**

Run: `cd /Users/lumino/Projects/0525App && npx tsc --noEmit 2>&1 | head -10`
Expected: No errors. Clean compilation.

- [ ] **Step 3: Verify Vite build**

Run: `cd /Users/lumino/Projects/0525App && npx vite build 2>&1`
Expected: Build succeeds, output in `dist/`.

---

### Task 16: Capacitor Setup for Android APK

**Files:**
- Modify: `/Users/lumino/Projects/0525App/vite.config.ts`
- Create: Capacitor config files (via CLI)

- [ ] **Step 1: Install Capacitor dependencies**

Run:
```bash
cd /Users/lumino/Projects/0525App
npm install @capacitor/core @capacitor/cli @capacitor/android
```

- [ ] **Step 2: Update vite.config.ts to ensure correct base path for Capacitor**

Edit `/Users/lumino/Projects/0525App/vite.config.ts` — change the `base` to `'./'`:

The current file content should be updated. Find the `base` property in the config and set it:
```typescript
export default defineConfig({
  base: './',
  plugins: [react()],
  // ... rest of config
});
```

- [ ] **Step 3: Initialize Capacitor**

Run:
```bash
cd /Users/lumino/Projects/0525App
npx cap init Momenta com.momenta.app --web-dir dist
npx cap add android
```

- [ ] **Step 4: Build and sync to Android**

Run:
```bash
cd /Users/lumino/Projects/0525App
npx vite build
npx cap sync
```

- [ ] **Step 5: Verify Android project created**

Run: `ls /Users/lumino/Projects/0525App/android/`
Expected: Should show Android project files (build.gradle, app/, gradle/, etc.)

- [ ] **Step 6: Build APK (requires Android Studio or Gradle)**

Run:
```bash
cd /Users/lumino/Projects/0525App/android
./gradlew assembleDebug 2>&1 | tail -10
```

Expected: APK generated at `android/app/build/outputs/apk/debug/app-debug.apk`

If `gradlew` is not executable: `chmod +x ./gradlew`

If Android SDK is not installed, note: this step requires Android Studio or Android SDK. The Capacitor project is set up and ready — opening `android/` in Android Studio will handle the build.

---

### Task 17: Add .env Support for API Key

**Files:**
- Create: `/Users/lumino/Projects/0525App/.env`
- Create: `/Users/lumino/Projects/0525App/.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# Anthropic API Key for LLM features (optional)
# Get one at https://console.anthropic.com/
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 2: Add .env to .gitignore**

Add `.env` to `/Users/lumino/Projects/0525App/.gitignore` if not already present:

```bash
echo ".env" >> /Users/lumino/Projects/0525App/.gitignore
```

- [ ] **Step 3: Final verification — rebuild**

Run:
```bash
cd /Users/lumino/Projects/0525App
npx tsc --noEmit 2>&1 && echo "TypeScript: OK" || echo "TypeScript: ERRORS"
npx vite build 2>&1 && echo "Build: OK" || echo "Build: ERRORS"
```

Expected: Both pass cleanly.

---

## Summary

| Task | Files | Action |
|------|-------|--------|
| 1 | `lib/types.ts` | Rewrite — add Message, extend Project |
| 2 | `lib/storage.ts` | Rewrite — v2 format, migration, message CRUD |
| 3 | `lib/engine.ts` | Modify — adapt to Message[] |
| 4 | `lib/llmService.ts` | Create — Anthropic API integration |
| 5 | `hooks/useApp.tsx` | Rewrite — new types, LLM integration, proactive alerts |
| 6 | `components/chat/ChatHeader.tsx` | Create |
| 7 | `components/chat/ChatInput.tsx` | Create |
| 8 | `components/chat/*Bubble.tsx` | Create — SystemBubble, UserBubble, MessageBubble |
| 9 | `components/list/*.tsx` | Create — ConversationRow, SearchBar |
| 10 | `pages/MessageListPage.tsx` | Create |
| 11 | `pages/ChatPage.tsx` | Create |
| 12 | `pages/NewChatPage.tsx` | Create |
| 13 | `pages/SettingsPage.tsx` | Rewrite — add API key management |
| 14 | `App.tsx`, `App.css` | Rewrite — new routing, chat styles |
| 15 | Old pages/sections | Delete — 6 old pages + sections/ dir |
| 16 | Capacitor config | Setup — Android APK generation |
| 17 | `.env`, `.gitignore` | Create — API key config |
