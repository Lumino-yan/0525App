import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../hooks/useApp';
import { getProjectById } from '../lib/storage';
import { generateId } from '../lib/engine';
import { ArrowLeft, X } from 'lucide-react';
import type { Urgency } from '../lib/types';

export default function NewProject() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const existing = isEdit && id ? getProjectById(id) : undefined;

  const { addProject, updateProject } = useApp();

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [urgency, setUrgency] = useState<Urgency>(existing?.urgency ?? 'medium');
  const [deadline, setDeadline] = useState(existing?.deadline ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const urgencyOptions: { value: Urgency; label: string; color: string }[] = [
    { value: 'low', label: '低', color: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
    { value: 'medium', label: '中', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: 'high', label: '高', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { value: 'critical', label: '紧急', color: 'bg-red-50 text-red-600 border-red-200' },
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '请输入项目名称';
    if (!description.trim()) e.description = '请输入项目描述';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    if (isEdit && existing) {
      updateProject(existing.id, {
        name: name.trim(),
        description: description.trim(),
        urgency,
        deadline: deadline || null,
      });
      navigate(`/project/${existing.id}`);
    } else {
      const project = {
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        urgency,
        deadline: deadline || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completed: false,
        completedAt: null,
        manualProgress: null,
      };
      addProject(project);
      navigate(`/project/${project.id}`);
    }
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-neutral-200/50 transition-colors"
          >
            {isEdit ? <ArrowLeft size={20} className="text-neutral-600" /> : <X size={20} className="text-neutral-600" />}
          </button>
          <h1 className="text-base font-semibold text-neutral-900">
            {isEdit ? '编辑项目' : '新建项目'}
          </h1>
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            className="px-4 h-8 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            项目名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：Q3 产品改版"
            className={`w-full h-11 px-4 bg-white rounded-xl border text-sm placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${
              errors.name ? 'border-red-300 focus:border-red-400' : 'border-neutral-200 focus:border-violet-400'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            项目描述 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简单描述这个项目要做什么..."
            rows={3}
            className={`w-full px-4 py-3 bg-white rounded-xl border text-sm placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none transition-all ${
              errors.description ? 'border-red-300 focus:border-red-400' : 'border-neutral-200 focus:border-violet-400'
            }`}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">优先级</label>
          <div className="flex gap-2">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUrgency(opt.value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  urgency === opt.value
                    ? opt.color + ' ring-2 ring-offset-1 ring-violet-300'
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1.5">
            系统会根据优先级、截止日期和更新频率综合判断提醒顺序
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            截止日期 <span className="text-neutral-400 font-normal">（可选）</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-11 px-4 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
