import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { resetData } from '../lib/storage';
import { AlertTriangle, RotateCcw, Trash2, ChevronRight, Info } from 'lucide-react';

export default function SettingsPage() {
  const { data, resetAll } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const activeProjects = data.projects.filter((p) => !p.completed).length;
  const completedProjects = data.projects.filter((p) => p.completed).length;
  const totalLogs = data.logs.length;

  return (
    <div className="min-h-[calc(100vh-80px)] pb-8">
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">设置</h1>
        <p className="text-sm text-neutral-400 mt-1">管理你的数据和偏好</p>
      </div>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">数据概览</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{activeProjects}</div>
              <div className="text-[11px] text-neutral-400">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{completedProjects}</div>
              <div className="text-[11px] text-neutral-400">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-700">{totalLogs}</div>
              <div className="text-[11px] text-neutral-400">进展记录</div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-2xl overflow-hidden card-shadow">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <span className="text-lg font-extrabold text-violet-600">M</span>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">瞬目纪 MOMENTA</h3>
              <p className="text-xs text-neutral-400">v1.0 · 本地优先的项目管理工具</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs text-neutral-400 leading-relaxed">
              MOMENTA 是一个为创意工作者设计的智能项目管理工具。你不需要提前拆解任务，
              只需在每次有进展时随手记录，系统会自动估算项目进度，并根据优先级、截止日期
              和更新频率智能推荐你该先处理哪个项目。
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">工作原理</h3>
          <div className="space-y-3">
            {[
              { title: '自动进度估算', desc: '基于你的进展记录数量和频率，自动推算项目完成度，无需手动设置百分比' },
              { title: '智能排序', desc: '综合优先级、截止日期、更新频率等因素，推荐你最该处理的项目' },
              { title: '本地存储', desc: '所有数据保存在你的浏览器本地，不会上传到任何服务器' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <Info size={16} className="text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-neutral-700">{item.title}</div>
                  <div className="text-xs text-neutral-400 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">危险区域</h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full bg-white rounded-xl p-4 card-shadow flex items-center gap-3 text-left hover:bg-neutral-50 transition-colors"
          >
            <RotateCcw size={16} className="text-amber-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-700">重置为示例数据</div>
              <div className="text-[11px] text-neutral-400">恢复初始的演示数据</div>
            </div>
            <ChevronRight size={14} className="text-neutral-300" />
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full bg-white rounded-xl p-4 card-shadow flex items-center gap-3 text-left hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-700">清除所有数据</div>
              <div className="text-[11px] text-neutral-400">删除所有项目和记录，不可恢复</div>
            </div>
            <ChevronRight size={14} className="text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 m-0 sm:m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={18} className="text-amber-500" />
              <h3 className="font-semibold text-neutral-900">重置数据</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              这将删除你当前的所有数据，并恢复初始的示例项目。此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetAll();
                  setShowResetConfirm(false);
                }}
                className="flex-1 h-10 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
              >
                确认重置
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-10 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-xl"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 m-0 sm:m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-semibold text-neutral-900">清除所有数据</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              这将永久删除所有项目和进展记录。此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetData();
                  setShowClearConfirm(false);
                  window.location.reload();
                }}
                className="flex-1 h-10 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-10 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-xl"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
