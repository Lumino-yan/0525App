import type { Project, SmartTask, Urgency, Thought, Task, ThoughtColor } from './types';
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

  // Recency boost — recent activity means momentum
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

  // Time pressure factor — if deadline is approaching, project likely further along
  let deadlineProgress = 0;
  if (project.deadline) {
    const totalSpan = (new Date(project.deadline).getTime() + DAY - project.createdAt);
    const elapsed = now - project.createdAt;
    if (totalSpan > 0) {
      deadlineProgress = (elapsed / totalSpan) * 100;
    }
  }

  // Blend: log progress weighted more heavily, but deadline creates a soft ceiling
  let finalProgress = logProgress * recencyMultiplier;

  if (deadlineProgress > 0) {
    // Pull progress toward the elapsed-time estimate (soft constraint)
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

      // --- Score Components ---

      // 1. Urgency (manual, 0-10)
      const urgencyScore = URGENCY_WEIGHT[project.urgency];

      // 2. Staleness — projects idle for long get boosted
      const stalenessScore = Math.min(10, daysSinceActivity * 0.8);

      // 3. Deadline pressure
      let deadlineScore = 0;
      if (project.deadline) {
        const daysUntil = (new Date(project.deadline).getTime() - now) / DAY;
        if (daysUntil < 0) deadlineScore = 12; // overdue!
        else if (daysUntil < 3) deadlineScore = 10;
        else if (daysUntil < 7) deadlineScore = 7;
        else if (daysUntil < 14) deadlineScore = 4;
        else deadlineScore = 1;
      } else {
        deadlineScore = 2; // no deadline = moderate
      }

      // 4. Momentum factor — nearly done projects get slight boost
      const momentumScore = progress > 80 ? 3 : progress > 50 ? 1 : 0;

      // 5. Cold-start — brand new projects with 0 logs need attention
      const coldStartScore = logCount === 0 ? 5 : logCount < 3 ? 2 : 0;

      // --- Composite Score ---
      const priorityScore =
        urgencyScore * 2.0 +
        stalenessScore * 1.5 +
        deadlineScore * 1.8 +
        momentumScore * 0.8 +
        coldStartScore * 1.0;

      // --- Determine urgency tier ---
      let urgency: 'now' | 'soon' | 'later' = 'later';
      if (priorityScore >= 25 || project.urgency === 'critical') {
        urgency = 'now';
      } else if (priorityScore >= 15 || project.urgency === 'high') {
        urgency = 'soon';
      }

      // --- Human-readable reason ---
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

      // --- Suggested Action ---
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

  // Sort descending by priority score
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

// ---- Task Progress ----

export function getTaskProgress(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) {
    return estimateProgress(project);
  }
  const completed = project.tasks.filter((t) => t.completed).length;
  return Math.round((completed / project.tasks.length) * 100);
}

export function getNextTask(project: Project): Task | null {
  if (!project.tasks) return null;
  const sorted = [...project.tasks].sort((a, b) => a.order - b.order);
  return sorted.find((t) => !t.completed) ?? null;
}

// ---- Thought Utilities ----

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return formatDate(ts);
}

export function groupThoughtsByDate(thoughts: Thought[]): { label: string; items: Thought[] }[] {
  const groups: { label: string; items: Thought[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - DAY;

  for (const thought of thoughts) {
    const thoughtDate = new Date(thought.createdAt);
    const thoughtDay = new Date(thoughtDate.getFullYear(), thoughtDate.getMonth(), thoughtDate.getDate()).getTime();

    let label: string;
    if (thoughtDay === today) {
      label = '今天';
    } else if (thoughtDay === yesterday) {
      label = '昨天';
    } else {
      label = thoughtDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    }

    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(thought);
  }

  return groups;
}

export const COLOR_MAP: Record<NonNullable<ThoughtColor>, { dot: string; bg: string; label: string }> = {
  red: { dot: 'bg-[#EF9A9A]', bg: 'bg-[#FFEBEE]', label: '紧急' },
  orange: { dot: 'bg-[#FFB74D]', bg: 'bg-[#FFF3E0]', label: '待办' },
  blue: { dot: 'bg-[#81D4FA]', bg: 'bg-[#E3F2FD]', label: '记录' },
  green: { dot: 'bg-[#9CCC65]', bg: 'bg-[#F1F8E9]', label: '稍后' },
  purple: { dot: 'bg-[#CE93D8]', bg: 'bg-[#F3E5F5]', label: '灵感' },
};
