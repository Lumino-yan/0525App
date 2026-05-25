import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getTaskProgress, generateId, daysUntil, formatFullDate } from '../lib/engine';
import TaskRow from '../components/project/TaskRow';
import GuidanceCard from '../components/project/GuidanceCard';
import { ArrowLeft, Plus } from 'lucide-react';

const URGENCY_LABELS: Record<string, string> = {
  critical: '紧急',
  high: '高优先级',
  medium: '中等',
  low: '低优先级',
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data,
    addTask,
    deleteTask,
    toggleTask,
    generateProjectGuidance,
  } = useApp();

  const project = data.projects.find((p) => p.id === id);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  useEffect(() => {
    if (!project) return;
    async function load() {
      setGuidanceLoading(true);
      const g = await generateProjectGuidance(project!.id);
      if (g) setGuidance(g);
      setGuidanceLoading(false);
    }
    load();
  }, [project?.id, generateProjectGuidance]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto flex flex-col items-center justify-center">
        <p className="text-[#8D6E63]">项目不存在</p>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-[#9CCC65] text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  const projectId = project.id;
  const progress = getTaskProgress(project);
  const deadlineDays = daysUntil(project.deadline);
  const tasks = (project.tasks ?? []).sort((a, b) => a.order - b.order);

  function handleAddTask() {
    const trimmed = newTaskContent.trim();
    if (!trimmed) return;
    addTask({
      id: generateId(),
      projectId,
      content: trimmed,
      completed: false,
      order: tasks.length,
    });
    setNewTaskContent('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-[#FFF8E1] border-b border-[#E8D5B0] px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#8D6E63]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-[#4E342E] truncate">
            {project.name}
          </h1>
        </div>
        {project.completed && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C8E6C9] text-[#2E7D32] font-medium">
            已完成
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Project info */}
        <div className="px-4 py-4 space-y-3">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-[#F5E6C8] text-[#8D6E63]">
              {URGENCY_LABELS[project.urgency] ?? project.urgency}
            </span>
            {project.deadline && (
              <span className={`px-2 py-1 rounded-full text-[#4E342E] ${
                deadlineDays !== null && deadlineDays !== undefined && deadlineDays <= 3
                  ? 'bg-[#FFCDD2] text-[#B71C1C]'
                  : 'bg-[#C8E6C9]'
              }`}>
                {project.deadline}
                {deadlineDays !== null && deadlineDays !== undefined
                  ? ` (${deadlineDays < 0 ? '已逾期' : `${deadlineDays}天后`})`
                  : ''}
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-[#E8D5B0] text-[#8D6E63]">
              创建于 {formatFullDate(project.createdAt)}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-[#8D6E63] leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#8D6E63]">任务进度</span>
              <span className="text-xs font-medium text-[#4E342E]">
                {tasks.filter((t) => t.completed).length}/{tasks.length} · {progress}%
              </span>
            </div>
            <div className="h-2 bg-[#F5E6C8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#9CCC65] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Guidance */}
        <GuidanceCard
          guidance={guidance}
          loading={guidanceLoading}
        />

        {/* Task list */}
        <div className="mt-4">
          <h2 className="px-4 text-xs text-[#8D6E63] font-medium mb-1 uppercase tracking-wider">
            任务列表
          </h2>
          <div className="bg-[#FFFBEF] rounded-t-2xl mx-4 divide-y divide-[#E8D5B0]/50">
            {tasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#8D6E63]">还没有任务步骤</p>
                <p className="text-xs text-[#A1887F] mt-1">在下方添加第一个步骤</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            )}
          </div>

          {/* Inline add task */}
          <div className="mx-4 bg-[#FFFBEF] rounded-b-2xl px-4 py-3 border-t border-[#E8D5B0]/50 mb-4">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#9CCC65] shrink-0" />
              <input
                type="text"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="添加新步骤..."
                className="flex-1 bg-transparent text-sm text-[#4E342E] placeholder-[#A1887F] outline-none"
              />
              {newTaskContent.trim() && (
                <button
                  onClick={handleAddTask}
                  className="px-3 py-1 bg-[#9CCC65] text-[#4E342E] text-xs font-medium rounded-full hover:bg-[#8BC34A] transition-colors"
                >
                  添加
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
