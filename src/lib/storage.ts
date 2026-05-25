import type { AppData, Project, Message, Thought, ThoughtNote, Task } from './types';

const STORAGE_KEY = 'pip_data_v1';
const OLD_STORAGE_KEY = 'momenta_data_v2';

// ---- Migration from v1 ----

function migrateFromV1(): AppData | null {
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as { projects: Project[]; messages: Message[] };

    // Ensure all projects have new fields
    const projects: Project[] = old.projects.map((p) => ({
      ...p,
      tasks: (p as any).tasks ?? [],
      aiSummary: (p as any).aiSummary ?? '',
    }));

    const newData: AppData = {
      thoughts: [],
      thoughtNotes: [],
      tasks: [],
      projects,
      messages: old.messages ?? [],
    };
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
  d.tasks = d.tasks.filter((t) => t.projectId !== id);
  // Unlink thoughts from deleted project
  d.thoughts.forEach((t) => {
    if (t.projectId === id) t.projectId = undefined;
  });
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

// ---- Thought CRUD ----

export function addThought(thought: Thought): void {
  const d = getData();
  d.thoughts.push(thought);
  touch();
}

export function updateThought(id: string, updates: Partial<Thought>): void {
  const d = getData();
  const idx = d.thoughts.findIndex((t) => t.id === id);
  if (idx >= 0) {
    d.thoughts[idx] = { ...d.thoughts[idx], ...updates };
    touch();
  }
}

export function deleteThought(id: string): void {
  const d = getData();
  d.thoughts = d.thoughts.filter((t) => t.id !== id);
  touch();
}

export function getUnprocessedThoughts(): Thought[] {
  return getData()
    .thoughts.filter((t) => !t.processed)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getThoughtsForProject(projectId: string): Thought[] {
  return getData()
    .thoughts.filter((t) => t.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---- ThoughtNote CRUD ----

export function addThoughtNote(note: ThoughtNote): void {
  const d = getData();
  if (!d.thoughtNotes) d.thoughtNotes = [];
  d.thoughtNotes.push(note);
  touch();
}

export function updateThoughtNote(id: string, updates: Partial<ThoughtNote>): void {
  const d = getData();
  if (!d.thoughtNotes) d.thoughtNotes = [];
  const idx = d.thoughtNotes.findIndex((n) => n.id === id);
  if (idx >= 0) {
    d.thoughtNotes[idx] = { ...d.thoughtNotes[idx], ...updates };
    touch();
  }
}

export function deleteThoughtNote(id: string): void {
  const d = getData();
  if (!d.thoughtNotes) return;
  d.thoughtNotes = d.thoughtNotes.filter((n) => n.id !== id);
  touch();
}

export function getNotesForThought(thoughtId: string): ThoughtNote[] {
  const d = getData();
  if (!d.thoughtNotes) return [];
  return d.thoughtNotes
    .filter((n) => n.thoughtId === thoughtId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// ---- Task CRUD ----

export function addTask(task: Task): void {
  const d = getData();
  d.tasks.push(task);
  touch();
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const d = getData();
  const idx = d.tasks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    d.tasks[idx] = { ...d.tasks[idx], ...updates };
    touch();
  }
}

export function deleteTask(id: string): void {
  const d = getData();
  d.tasks = d.tasks.filter((t) => t.id !== id);
  touch();
}

export function getTasksForProject(projectId: string): Task[] {
  return getData()
    .tasks.filter((t) => t.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

// ---- Seed Demo Data ----

function seedDemoData(): AppData {
  const now = Date.now();
  const day = 86400000;

  const tasks: Task[] = [
    { id: 'task-1', projectId: 'demo-1', content: '首页线框图和信息架构确认', completed: true, order: 0 },
    { id: 'task-2', projectId: 'demo-1', content: '视觉风格探索和方案确定', completed: true, order: 1 },
    { id: 'task-3', projectId: 'demo-1', content: '首页首屏高保真设计', completed: true, order: 2 },
    { id: 'task-4', projectId: 'demo-1', content: '用户中心全部页面设计', completed: false, order: 3 },
    { id: 'task-5', projectId: 'demo-1', content: '响应式适配和交互细节', completed: false, order: 4 },
    { id: 'task-6', projectId: 'demo-2', content: '整理现有品牌素材和设计文件', completed: true, order: 0 },
    { id: 'task-7', projectId: 'demo-2', content: '确定手册大纲结构和章节划分', completed: true, order: 1 },
    { id: 'task-8', projectId: 'demo-2', content: '色彩规范和字体规范章节', completed: true, order: 2 },
    { id: 'task-9', projectId: 'demo-2', content: '组件规范和布局规范章节', completed: false, order: 3 },
    { id: 'task-10', projectId: 'demo-2', content: '最终审校和导出交付', completed: false, order: 4 },
    { id: 'task-11', projectId: 'demo-3', content: '客户初步需求沟通', completed: true, order: 0 },
    { id: 'task-12', projectId: 'demo-3', content: '竞品分析和市场洞察报告', completed: true, order: 1 },
    { id: 'task-13', projectId: 'demo-3', content: '品牌策略框架撰写', completed: false, order: 2 },
    { id: 'task-14', projectId: 'demo-3', content: '提案PPT制作和美化', completed: false, order: 3 },
    { id: 'task-15', projectId: 'demo-3', content: '内部预演和修改', completed: false, order: 4 },
  ];

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
      lastMessagePreview: '下一步：用户中心全部页面设计',
      lastMessageAt: now - 2 * day,
      tasks: tasks.filter((t) => t.projectId === 'demo-1'),
      aiSummary: '已有5天未更新，进展偏慢。建议今天推进用户中心页面设计。',
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
      lastMessagePreview: '下一步：组件规范和布局规范',
      lastMessageAt: now - 7 * day,
      tasks: tasks.filter((t) => t.projectId === 'demo-2'),
      aiSummary: '进展正常，还有充足时间。当前完成了色彩和字体规范，继续推进组件规范。',
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
      lastMessagePreview: '3天后截止！开始策略框架撰写',
      lastMessageAt: now - 1 * day,
      tasks: tasks.filter((t) => t.projectId === 'demo-3'),
      aiSummary: '仅剩3天，非常紧急！策略框架和提案PPT都还没开始，建议今天全力推进。',
    },
  ];

  const thoughts: Thought[] = [
    { id: 'th-1', content: '可能还需要做移动端适配的方案', color: null, createdAt: now - 3 * day, processed: true, projectId: 'demo-1' },
    { id: 'th-2', content: '找参考：Airbnb和Stripe的改版案例', color: 'blue', createdAt: now - 2 * day, processed: true, projectId: 'demo-1' },
    { id: 'th-3', content: '品牌手册要加上应用示例章节', color: 'green', createdAt: now - 6 * day, processed: true, projectId: 'demo-2' },
    { id: 'th-4', content: '新能源政策最新动态要更新到竞品分析里', color: 'orange', createdAt: now - 1 * day, processed: false },
    { id: 'th-5', content: '下周约技术团队过一遍交互方案', color: 'red', createdAt: now - 8 * 3600000, processed: false },
    { id: 'th-6', content: '提案可以加上ESG和碳中和的切入点', color: 'purple', createdAt: now - 5 * 3600000, processed: false },
    { id: 'th-7', content: '下次改版可以考虑做暗色模式', color: 'blue', createdAt: now - 2 * 3600000, processed: false },
  ];

  const messages: Message[] = [
    { id: 'msg-1', projectId: 'demo-1', role: 'user', content: '完成了首页线框图的初稿，和客户确认了信息架构', type: 'log', timestamp: now - 20 * day },
    { id: 'msg-2', projectId: 'demo-1', role: 'assistant', content: '已记录进展。首页线框图确认后，建议下一步做视觉风格探索。', type: 'suggestion', timestamp: now - 20 * day + 1000 },
    { id: 'msg-3', projectId: 'demo-1', role: 'user', content: '视觉风格探索做了3个方向，内部评审后确定了方案B', type: 'log', timestamp: now - 15 * day },
    { id: 'msg-4', projectId: 'demo-1', role: 'user', content: '首页首屏的高保真设计稿完成，等待开发评审', type: 'log', timestamp: now - 10 * day },
    { id: 'msg-5', projectId: 'demo-1', role: 'user', content: '根据开发反馈调整了部分交互细节', type: 'log', timestamp: now - 5 * day },
    { id: 'msg-6', projectId: 'demo-1', role: 'user', content: '用户中心页面的设计进行中，完成了个人信息模块', type: 'log', timestamp: now - 2 * day },
    { id: 'msg-7', projectId: 'demo-1', role: 'system', content: 'Q3产品改版已经5天没有更新了。建议今天推进用户中心页面设计。', type: 'alert', timestamp: now - 1 * day },
    { id: 'msg-8', projectId: 'demo-2', role: 'user', content: '整理了现有的品牌素材和过往设计文件', type: 'log', timestamp: now - 14 * day },
    { id: 'msg-9', projectId: 'demo-2', role: 'user', content: '确定了品牌手册的大纲结构和章节划分', type: 'log', timestamp: now - 10 * day },
    { id: 'msg-10', projectId: 'demo-2', role: 'user', content: '完成了色彩规范和字体规范章节', type: 'log', timestamp: now - 7 * day },
    { id: 'msg-11', projectId: 'demo-3', role: 'user', content: '和客户进行了初步需求沟通，了解了品牌背景', type: 'log', timestamp: now - 4 * day },
    { id: 'msg-12', projectId: 'demo-3', role: 'user', content: '完成了竞品分析和市场洞察报告', type: 'log', timestamp: now - 1 * day },
    { id: 'msg-13', projectId: 'demo-3', role: 'system', content: '客户提案还剩3天截止！目前完成了初步调研和竞品分析，建议今天开始策略框架的撰写。', type: 'alert', timestamp: now },
  ];

  const thoughtNotes: ThoughtNote[] = [
    { id: 'note-1', thoughtId: 'th-1', content: '可以用 Capacitor 做一套响应式断点，在 Figma 里先画好。', createdAt: now - 2 * day },
    { id: 'note-2', thoughtId: 'th-4', content: '重点看补贴退坡对客户项目的影响。', createdAt: now - 12 * 3600000 },
  ];

  return { thoughts, thoughtNotes, projects, tasks, messages };
}

export function resetData(): void {
  const seeded = seedDemoData();
  _data = seeded;
  saveData(seeded);
}
