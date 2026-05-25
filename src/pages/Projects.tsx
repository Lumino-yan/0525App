import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { formatDate, daysUntil } from '../lib/engine';
import { Plus, Search, CheckCircle2, Clock, ArrowUpDown } from 'lucide-react';
import type { Project } from '../lib/types';

type SortMode = 'smart' | 'recent' | 'name' | 'urgency';

export default function Projects() {
  const { data, toggleComplete, getProgress } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('smart');
  const [showCompleted, setShowCompleted] = useState(false);

  const filtered = data.projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = showCompleted ? true : !p.completed;
    return matchSearch && matchStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'smart') {
      const progA = getProgress(a.id);
      const progB = getProgress(b.id);
      // Nearly done first, then by urgency
      if (progA >= 80 && progB < 80) return -1;
      if (progB >= 80 && progA < 80) return 1;
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    if (sort === 'recent') return b.updatedAt - a.updatedAt;
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'urgency') {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return 0;
  });

  const activeCount = data.projects.filter((p) => !p.completed).length;
  const completedCount = data.projects.filter((p) => p.completed).length;

  return (
    <div className="min-h-[calc(100vh-80px)] pb-8">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">项目</h1>
          <button
            onClick={() => navigate('/new-project')}
            className="w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white rounded-xl border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompleted(false)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${!showCompleted ? 'bg-violet-50 text-violet-600' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            进行中 ({activeCount})
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${showCompleted ? 'bg-violet-50 text-violet-600' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            已完成 ({completedCount})
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSort(sort === 'smart' ? 'recent' : sort === 'recent' ? 'name' : sort === 'name' ? 'urgency' : 'smart')}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <ArrowUpDown size={12} />
            {sort === 'smart' ? '智能排序' : sort === 'recent' ? '最近更新' : sort === 'name' ? '名称' : '优先级'}
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="px-5 mt-2 space-y-2">
        {sorted.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            progress={getProgress(project.id)}
            onClick={() => navigate(`/project/${project.id}`)}
            onToggle={() => toggleComplete(project.id)}
          />
        ))}
      </div>

      {/* Empty */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <Clock size={32} className="text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-400">
            {search ? '没有找到匹配的项目' : showCompleted ? '还没有已完成的项目' : '暂无项目，点击右上角 + 创建一个'}
          </p>
        </div>
      )}
    </div>
  );
}

function ProjectListItem({
  project,
  progress,
  onClick,
  onToggle,
}: {
  project: Project;
  progress: number;
  onClick: () => void;
  onToggle: () => void;
}) {
  const d = daysUntil(project.deadline);

  const urgencyDot =
    project.urgency === 'critical'
      ? 'bg-red-500'
      : project.urgency === 'high'
        ? 'bg-orange-500'
        : project.urgency === 'medium'
          ? 'bg-amber-400'
          : 'bg-neutral-300';

  return (
    <div
      className="bg-white rounded-xl p-3.5 flex items-center gap-3 card-shadow cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        className="shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {project.completed ? (
          <CheckCircle2 size={20} className="text-violet-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 hover:border-violet-400 transition-colors" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${urgencyDot}`} />
          <h3 className={`font-medium text-sm truncate ${project.completed ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
            {project.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400">
            {d !== null ? (d < 0 ? `逾期 ${Math.abs(d)} 天` : `${d} 天后截止`) : '无截止日期'}
          </span>
          <span className="text-[11px] text-neutral-300">·</span>
          <span className="text-[11px] text-neutral-400">
            更新于 {formatDate(project.updatedAt)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0 text-right">
        <div className="text-xs font-semibold text-neutral-600">{progress}%</div>
        <div className="w-12 h-1 bg-neutral-100 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: progress >= 80
                ? '#22c55e'
                : progress >= 40
                  ? '#7c3aed'
                  : '#f59e0b',
            }}
          />
        </div>
      </div>
    </div>
  );
}
