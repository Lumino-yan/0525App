import type { Project } from '../../lib/types';
import { getTaskProgress, getNextTask, daysUntil } from '../../lib/engine';

interface ProjectCardProps {
  project: Project;
  onTap?: () => void;
}

const URGENCY_BADGE: Record<string, { text: string; bg: string }> = {
  critical: { text: '紧急', bg: 'bg-[#FFCDD2] text-[#B71C1C]' },
  high: { text: '高优', bg: 'bg-[#FFECB3] text-[#E65100]' },
  medium: { text: '中等', bg: 'bg-[#C8E6C9] text-[#2E7D32]' },
  low: { text: '低优', bg: 'bg-[#F5F5F5] text-[#8D6E63]' },
};

export default function ProjectCard({ project, onTap }: ProjectCardProps) {
  const progress = getTaskProgress(project);
  const nextTask = getNextTask(project);
  const deadlineDays = daysUntil(project.deadline);
  const badge = URGENCY_BADGE[project.urgency] ?? URGENCY_BADGE.medium;

  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-[#FFFBEF] rounded-2xl p-4 card-shadow hover:card-shadow-hover transition-shadow active:bg-[#F5E6C8]/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[15px] font-semibold text-[#4E342E] leading-snug line-clamp-1 flex-1">
          {project.name}
        </h3>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      {/* Description */}
      {project.aiSummary && (
        <p className="text-xs text-[#8D6E63] leading-relaxed line-clamp-2 mb-3">
          {project.aiSummary}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8D6E63]">进度</span>
          <span className="text-xs font-medium text-[#4E342E]">{progress}%</span>
        </div>
        <div className="h-1.5 bg-[#F5E6C8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9CCC65] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom row: next task / deadline */}
      <div className="flex items-center justify-between text-xs">
        {nextTask ? (
          <span className="text-[#8D6E63] truncate mr-2">
            下一步：{nextTask.content}
          </span>
        ) : (
          <span className="text-[#A1887F]">暂无待办</span>
        )}
        {deadlineDays !== null && deadlineDays !== undefined && (
          <span className={`font-medium shrink-0 ${deadlineDays <= 3 ? 'text-[#EF9A9A]' : 'text-[#8D6E63]'}`}>
            {deadlineDays < 0 ? '已逾期' : `${deadlineDays}天后`}
          </span>
        )}
      </div>
    </button>
  );
}
