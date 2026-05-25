import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { daysUntil } from '../lib/engine';
import { Flame, Clock, Zap, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Project } from '../lib/types';

export default function Today() {
  const { smartTasks, toggleComplete, data, getProgress } = useApp();
  const navigate = useNavigate();

  const now = smartTasks.filter((t) => t.urgency === 'now');
  const soon = smartTasks.filter((t) => t.urgency === 'soon');
  const later = smartTasks.filter((t) => t.urgency === 'later');

  const activeProjects = data.projects.filter((p) => !p.completed).length;
  const completedToday = data.logs.filter(
    (l) => Date.now() - l.timestamp < 86400000
  ).length;

  return (
    <div className="min-h-[calc(100vh-80px)] pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">今天</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-neutral-400">
                {activeProjects} 个进行中的项目
              </div>
              <div className="text-xs text-neutral-400">
                {completedToday > 0 ? `今日已更新 ${completedToday} 次` : '今日尚无更新'}
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-neutral-400">
          根据你的项目状态，建议优先处理以下内容
        </p>
      </div>

      {/* Now Section */}
      {now.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-neutral-600">立即处理</h2>
          </div>
          <div className="space-y-3">
            {now.map((task) => (
              <TaskCard key={task.project.id} task={task} onToggle={() => toggleComplete(task.project.id)} onClick={() => navigate(`/project/${task.project.id}`)} getProgress={getProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Soon Section */}
      {soon.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-600">尽快安排</h2>
          </div>
          <div className="space-y-3">
            {soon.map((task) => (
              <TaskCard key={task.project.id} task={task} onToggle={() => toggleComplete(task.project.id)} onClick={() => navigate(`/project/${task.project.id}`)} getProgress={getProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Later Section */}
      {later.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-neutral-600">持续跟进</h2>
          </div>
          <div className="space-y-3">
            {later.map((task) => (
              <TaskCard key={task.project.id} task={task} onToggle={() => toggleComplete(task.project.id)} onClick={() => navigate(`/project/${task.project.id}`)} getProgress={getProgress} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {smartTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-1">所有任务已完成</h3>
          <p className="text-sm text-neutral-400 text-center mb-4">
            太棒了！你目前没有进行中的项目。<br />创建一个新项目来开始吧。
          </p>
          <button
            onClick={() => navigate('/new-project')}
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            创建项目
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onClick,
  getProgress,
}: {
  task: { project: Project; reason: string; suggestedAction: string; urgency: string };
  onToggle: () => void;
  onClick: () => void;
  getProgress: (id: string) => number;
}) {
  const progress = getProgress(task.project.id);
  const d = daysUntil(task.project.deadline);

  const urgencyColor =
    task.project.urgency === 'critical'
      ? 'bg-red-50 text-red-600 border-red-100'
      : task.project.urgency === 'high'
        ? 'bg-orange-50 text-orange-600 border-orange-100'
        : task.project.urgency === 'medium'
          ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-neutral-50 text-neutral-500 border-neutral-100';

  const urgencyLabel =
    task.project.urgency === 'critical'
      ? '紧急'
      : task.project.urgency === 'high'
        ? '高'
        : task.project.urgency === 'medium'
          ? '中'
          : '低';

  return (
    <div
      className="bg-white rounded-2xl p-4 card-shadow cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          className="mt-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 hover:border-violet-400 flex items-center justify-center transition-colors">
            {progress >= 100 && <CheckCircle2 size={14} className="text-violet-500" />}
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-neutral-900 truncate">{task.project.name}</h3>
            {d !== null && d < 0 && (
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
            )}
          </div>

          <p className="text-xs text-neutral-400 mb-2 line-clamp-1">{task.project.description}</p>

          {/* Reason pill */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${urgencyColor}`}>
              {urgencyLabel}
            </span>
            <span className="text-[11px] text-neutral-400">{task.reason}</span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress >= 80
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : progress >= 40
                      ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
                      : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
              />
            </div>
            <span className="text-[11px] text-neutral-400 font-medium w-8 text-right">{progress}%</span>
          </div>

          {/* Suggested action */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-violet-600 font-medium">{task.suggestedAction}</span>
            <ChevronRight size={14} className="text-neutral-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
