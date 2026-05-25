import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getLogsForProject, getProjectById } from '../lib/storage';
import { formatDate, daysUntil } from '../lib/engine';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Calendar,
  Clock,
  Edit3,
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleComplete, deleteProject, getProgress } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const project = id ? getProjectById(id) : undefined;
  const logs = id ? getLogsForProject(id) : [];
  const progress = project ? getProgress(project.id) : 0;

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <p className="text-neutral-400 mb-4">项目不存在</p>
        <button
          onClick={() => navigate('/projects')}
          className="text-violet-600 text-sm font-medium"
        >
          返回项目列表
        </button>
      </div>
    );
  }

  const d = daysUntil(project.deadline);
  const isOverdue = d !== null && d < 0;

  const urgencyColor =
    project.urgency === 'critical'
      ? 'bg-red-50 text-red-600 border-red-100'
      : project.urgency === 'high'
        ? 'bg-orange-50 text-orange-600 border-orange-100'
        : project.urgency === 'medium'
          ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-neutral-50 text-neutral-500 border-neutral-100';

  const urgencyLabel =
    project.urgency === 'critical'
      ? '紧急'
      : project.urgency === 'high'
        ? '高'
        : project.urgency === 'medium'
          ? '中'
          : '低';

  return (
    <div className="min-h-[calc(100vh-80px)] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900 truncate">{project.name}</h1>
          </div>

          <button
            onClick={() => navigate(`/edit-project/${project.id}`)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/50 transition-colors"
          >
            <Edit3 size={16} className="text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="px-5 pt-4">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${urgencyColor}`}>
              {urgencyLabel}
            </span>
            {isOverdue && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-medium flex items-center gap-1">
                <AlertTriangle size={10} />
                逾期 {Math.abs(d!)} 天
              </span>
            )}
            {project.completed && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
                已完成
              </span>
            )}
          </div>

          <p className="text-sm text-neutral-500 mb-4 leading-relaxed">{project.description}</p>

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-4">
            {project.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Calendar size={13} />
                <span>{project.deadline}</span>
                {!isOverdue && d !== null && d <= 7 && (
                  <span className="text-red-400">({d}天)</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Clock size={13} />
              <span>创建于 {formatDate(project.createdAt)}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">项目进度</span>
              <span className="text-sm font-bold text-neutral-900">{progress}%</span>
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
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
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {progress === 0
                ? '尚未开始，添加第一条进展记录吧'
                : progress >= 100
                  ? '项目已完成，干得好！'
                  : `基于 ${logs.length} 条进展记录自动估算`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/add-log/${project.id}`)}
              className="flex-1 h-10 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              添加进展
            </button>
            <button
              onClick={() => toggleComplete(project.id)}
              className={`flex-1 h-10 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                project.completed
                  ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {project.completed ? (
                <>
                  <CircleDot size={16} />
                  标记进行中
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  标记完成
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Log Timeline */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-700">进展记录</h2>
          <span className="text-xs text-neutral-400">{logs.length} 条</span>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center card-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
              <Plus size={20} className="text-violet-400" />
            </div>
            <p className="text-sm text-neutral-500 mb-1">还没有进展记录</p>
            <p className="text-xs text-neutral-400 mb-3">每次做了一点事情就记下来，系统会自动估算进度</p>
            <button
              onClick={() => navigate(`/add-log/${project.id}`)}
              className="text-violet-600 text-sm font-medium"
            >
              添加第一条记录
            </button>
          </div>
        ) : (
          <div className="space-y-0 relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-neutral-200" />

            {logs.map((log, idx) => (
              <LogItem key={log.id} log={log} isFirst={idx === 0} />
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="px-5 mt-8">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 text-xs text-red-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            删除项目
          </button>
        ) : (
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-red-600 mb-3">确定要删除这个项目吗？所有进展记录也将被删除，此操作不可撤销。</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteProject(project.id);
                  navigate('/projects');
                }}
                className="flex-1 h-9 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-9 bg-white text-neutral-600 text-sm font-medium rounded-lg border border-neutral-200"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({ log, isFirst }: { log: { id: string; content: string; timestamp: number }; isFirst: boolean }) {
  const { deleteLog } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative flex gap-3 pb-5">
      {/* Dot */}
      <div className="relative z-10 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${isFirst ? 'bg-violet-500 ring-4 ring-violet-100' : 'bg-neutral-300'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-700 leading-relaxed">{log.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-neutral-400">{formatDate(log.timestamp)}</span>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[11px] text-neutral-300 hover:text-red-400 transition-colors"
            >
              删除
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => deleteLog(log.id)}
                className="text-[11px] text-red-500 font-medium"
              >
                确认
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-neutral-400"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
