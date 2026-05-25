import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getProjectById } from '../lib/storage';
import { generateId } from '../lib/engine';
import { Send, X } from 'lucide-react';

export default function AddLog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addLog, getProgress } = useApp();
  const [content, setContent] = useState('');

  const project = id ? getProjectById(id) : undefined;
  const progress = project ? getProgress(project.id) : 0;

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <p className="text-neutral-400 mb-4">项目不存在</p>
        <button onClick={() => navigate('/projects')} className="text-violet-600 text-sm font-medium">
          返回项目列表
        </button>
      </div>
    );
  }

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || !project) return;

    addLog({
      id: generateId(),
      projectId: project.id,
      content: trimmed,
      timestamp: Date.now(),
    });

    navigate(`/project/${project.id}`);
  }

  // Quick suggestions based on progress
  const suggestions =
    progress === 0
      ? ['刚立项，开始梳理需求', '完成了初步调研', '和客户确认了项目方向']
      : progress < 30
        ? ['完成了方案A的初稿', '和客户进行了第一轮沟通', '整理了参考资料和灵感']
        : progress < 60
          ? ['完成了核心页面的设计', '根据反馈修改了细节', '和开发对齐了技术方案']
          : progress < 90
            ? ['完成了最终设计稿', '准备进入开发阶段', '做了最后的细节调整']
            : ['做了最后的检查和完善', '准备交付', '项目收尾工作完成'];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/50 transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900 truncate">添加进展</h1>
            <p className="text-[11px] text-neutral-400 truncate">{project.name} · 当前 {progress}%</p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="flex-1 flex flex-col px-5 pt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`今天做了什么进展？\n简单记录一下，比如"完成了首页设计"...`}
          className="flex-1 w-full px-4 py-4 bg-white rounded-2xl border border-neutral-200 text-base leading-relaxed placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none transition-all"
          autoFocus
        />

        {/* Suggestions */}
        <div className="py-4">
          <p className="text-xs text-neutral-400 mb-2">快捷输入</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setContent(s)}
                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:border-violet-300 hover:text-violet-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pb-6">
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              content.trim()
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
            记录进展
          </button>
        </div>
      </div>
    </div>
  );
}
