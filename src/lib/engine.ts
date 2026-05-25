import type { Project, SmartTask, Urgency } from './types';
import { getLogsForProject } from './storage';

const DAY = 86400000;
const URGENCY_WEIGHT: Record<Urgency, number> = {
  low: 1,
  medium: 3,
  high: 6,
  critical: 10,
};

// ---- Auto Progress Estimation ----

/**
 * Estimate project progress (0-100) based on log activity.
 * No manual sub-tasks needed — the system infers progress from activity patterns.
 */
/**
 * Get auto-estimated progress for a project.
 * Also exported as `getProgress` for convenience.
 */
export function getProgress(project: Project): number {
  return estimateProgress(project);
}

export function estimateProgress(project: Project): number {
  if (project.manualProgress !== null) {
    return project.manualProgress;
  }
  if (project.completed) return 100;

  const logs = getLogsForProject(project.id);
  const logCount = logs.length;

  if (logCount === 0) return 0;

  // Base progress from log count (diminishing returns)
  // 1 log ~ 10%, 3 logs ~ 25%, 5 logs ~ 35%, 10 logs ~ 50%, 20+ logs ~ 70%
  const logProgress = 100 * (1 - Math.exp(-logCount * 0.15));

  // Recency boost — recent activity means momentum
  const now = Date.now();
  const mostRecentLog = logs[0];
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

  // If we have a deadline, progress shouldn't wildly differ from elapsed time
  if (deadlineProgress > 0) {
    // Pull progress toward the elapsed-time estimate (soft constraint)
    const blend = 0.3; // 30% deadline influence
    finalProgress = finalProgress * (1 - blend) + deadlineProgress * blend;
  }

  return Math.min(100, Math.max(0, Math.round(finalProgress)));
}

// ---- Smart Task Ranking ----

/**
 * Rank all active projects by "what you should work on now".
 * Factors:
 * - Manual urgency
 * - Days since last activity (stale projects need attention)
 * - Deadline proximity
 * - Total activity (new projects need a kick-start)
 */
export function generateSmartTasks(projects: Project[]): SmartTask[] {
  const now = Date.now();

  const scored = projects
    .filter((p) => !p.completed)
    .map((project) => {
      const logs = getLogsForProject(project.id);
      const lastActivity = logs[0]?.timestamp ?? project.createdAt;
      const daysSinceActivity = (now - lastActivity) / DAY;
      const logCount = logs.length;
      const progress = estimateProgress(project);

      // --- Score Components ---

      // 1. Urgency (manual, 0-10)
      const urgencyScore = URGENCY_WEIGHT[project.urgency];

      // 2. Staleness — projects idle for long get boosted
      // 0 days = 0 pts, 3 days = 3 pts, 7 days = 7 pts, 14+ = 10 pts max
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
        urgencyScore * 2.0 + // urgency is most important
        stalenessScore * 1.5 + // stale projects need love
        deadlineScore * 1.8 + // deadlines matter
        momentumScore * 0.8 + // finish what's nearly done
        coldStartScore * 1.0; // start what's new

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

  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
