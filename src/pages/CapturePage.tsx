import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import CaptureBar from '../components/capture/CaptureBar';
import InboxList from '../components/capture/InboxList';
import GuidanceCard from '../components/project/GuidanceCard';
import ProjectCard from '../components/project/ProjectCard';
import type { ThoughtColor } from '../lib/types';
import { getStoredConfig, setLLMConfig, clearLLMConfig, type LLMProvider, type LLMConfig } from '../lib/llmService';
import { resetData } from '../lib/storage';
import {
  ListTodo,
  Zap,
  RotateCcw,
  Trash2,
  Key,
  ChevronRight,
  Cpu,
  Globe,
  Server,
  Sparkles,
  Lightbulb,
  Star,
  Coffee,
} from 'lucide-react';

const PROVIDER_INFO: Record<LLMProvider, { name: string; desc: string; placeholder: string }> = {
  anthropic: { name: 'Anthropic', desc: '推荐，中文理解力强，JSON 输出稳定', placeholder: 'sk-ant-...' },
  deepseek: { name: 'DeepSeek', desc: '性价比高，中文能力强', placeholder: 'sk-...' },
  openai: { name: 'OpenAI / 兼容', desc: '支持 Ollama、vLLM 等兼容接口', placeholder: 'sk-...' },
};

const PROVIDER_ICONS: Record<LLMProvider, typeof Cpu> = {
  anthropic: Cpu,
  deepseek: Globe,
  openai: Server,
};

const DEFAULT_MODELS: Record<LLMProvider, string[]> = {
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1'],
};

type TabId = 'thoughts' | 'projects' | 'settings';

export default function CapturePage() {
  const navigate = useNavigate();
  const {
    data,
    addThought,
    deleteThought,
    smartTasks,
    generateFocusGuidance,
    resetAll,
  } = useApp();

  const [tab, setTab] = useState<TabId>('thoughts');
  const [guidance, setGuidance] = useState<string | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  // Settings tab state
  const savedConfig = getStoredConfig();
  const [provider, setProvider] = useState<LLMProvider>(savedConfig?.provider ?? 'anthropic');
  const [apiKey, setApiKey] = useState(savedConfig?.apiKey ?? '');
  const [model, setModel] = useState(savedConfig?.model ?? DEFAULT_MODELS.anthropic[0]);
  const [baseUrl, setBaseUrl] = useState(savedConfig?.baseUrl ?? '');
  const [showKey, setShowKey] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    async function load() {
      setGuidanceLoading(true);
      const r = await generateFocusGuidance();
      if (r) setGuidance(r);
      setGuidanceLoading(false);
    }
    load();
  }, [generateFocusGuidance]);

  const thoughts = [...data.thoughts].sort((a, b) => b.createdAt - a.createdAt);
  const unprocessedCount = thoughts.filter((t) => !t.processed).length;
  const inboxThoughts = thoughts.filter((t) => !t.projectId);
  const activeProjects = [...data.projects].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeUrgent = smartTasks.filter((t) => t.urgency === 'now');
  function handleCapture(content: string, color: ThoughtColor) {
    addThought(content, color);
  }

  function handleSaveLLM() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      clearLLMConfig();
      return;
    }
    const config: LLMConfig = { provider, apiKey: trimmed, model };
    if (provider === 'openai' && baseUrl.trim()) config.baseUrl = baseUrl.trim();
    setLLMConfig(config);
  }

  // ---- Render tabs ----

  function renderThoughtsTab() {
    return (
      <>
        {/* Sticky urgent section — 冻结在最上方 */}
        {activeUrgent.length > 0 && (
          <div className="sticky top-[52px] z-20 bg-[#FFF8E1] pb-2 px-4 pt-1 -mt-1 border-b border-[#E8D5B0]/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={13} className="text-[#FFB74D]" />
              <h2 className="text-xs text-[#8D6E63] font-medium uppercase tracking-wider">需要立即关注</h2>
            </div>
            <div className="space-y-2">
              {activeUrgent.slice(0, 3).map((task) => (
                <ProjectCard
                  key={task.project.id}
                  project={task.project}
                  onTap={() => navigate(`/project/${task.project.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        <GuidanceCard
          guidance={guidance}
          loading={guidanceLoading}
          onTap={() => navigate('/review')}
        />

        {/* Inbox section */}
        {inboxThoughts.length > 0 && (
          <div className="mt-4">
            <h2 className="px-4 text-xs text-[#8D6E63] font-medium mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#FFB74D]" />
              收件箱
              <span className="w-4 h-4 rounded-full bg-[#C8E6C9] text-[10px] text-[#2E7D32] font-bold flex items-center justify-center ml-1">
                {inboxThoughts.length}
              </span>
            </h2>
            <InboxList
              thoughts={inboxThoughts}
              variant="inbox"
              onThoughtTap={(t) => navigate(`/thought/${t.id}`)}
              onThoughtLongPress={(t) => {
                if (window.confirm('删除这条念头？')) deleteThought(t.id);
              }}
            />
          </div>
        )}

        {/* All thoughts */}
        <div className="mt-4 pb-4">
          <h2 className="px-4 text-xs text-[#8D6E63] font-medium mb-1 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb size={12} className="text-[#FFB74D]" />
            所有念头
          </h2>
          <InboxList
            thoughts={thoughts}
            onThoughtTap={(t) => navigate(`/thought/${t.id}`)}
            onThoughtLongPress={(t) => {
              if (window.confirm('删除这条念头？')) deleteThought(t.id);
            }}
          />
        </div>
      </>
    );
  }

  function renderProjectsTab() {
    const active = activeProjects.filter((p) => !p.completed);
    const completed = activeProjects.filter((p) => p.completed);

    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Active projects */}
        <div>
          <h2 className="text-xs text-[#8D6E63] font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={12} className="text-[#FFB74D]" />
            进行中
            <span className="w-4 h-4 rounded-full bg-[#9CCC65] text-[10px] text-[#2E7D32] font-bold flex items-center justify-center">
              {active.length}
            </span>
          </h2>
          {active.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-3xl bg-[#FFECB3] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Sparkles size={28} className="text-[#FFB74D]" />
              </div>
              <p className="text-sm text-[#8D6E63]">还没有项目</p>
              <p className="text-xs text-[#A1887F] mt-1">记录一些念头后，AI 帮你整理创建</p>
              <button
                onClick={() => navigate('/review')}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#9CCC65] text-[#4E342E] text-xs font-medium rounded-2xl hover:bg-[#8BC34A] transition-colors"
              >
                <ListTodo size={14} />
                去整理收件箱
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onTap={() => navigate(`/project/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-xs text-[#8D6E63] font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Star size={12} className="text-[#FFB74D]" />
              已完成</h2>
            <div className="space-y-2 opacity-60">
              {completed.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onTap={() => navigate(`/project/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSettingsTab() {
    const activeCount = data.projects.filter((p) => !p.completed).length;
    const completedCount = data.projects.filter((p) => p.completed).length;
    const totalThoughts = data.thoughts.length;

    return (
      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* AI Provider */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} className="text-[#689F38]" />
            <h3 className="text-sm font-semibold text-[#4E342E]">AI 服务配置</h3>
          </div>
          <p className="text-[11px] text-[#8D6E63] mb-3">选择服务商、模型并填入 API Key。不设置也能使用基础功能。</p>

          {/* Provider */}
          <label className="text-[11px] text-[#8D6E63] mb-1.5 block">服务商</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map((p) => {
              const Icon = PROVIDER_ICONS[p];
              const info = PROVIDER_INFO[p];
              return (
                <button
                  key={p}
                  onClick={() => {
                    setProvider(p);
                    setModel(DEFAULT_MODELS[p][0]);
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl text-xs transition-colors ${
                    provider === p ? 'bg-[#C8E6C9] text-[#2E7D32] font-medium ring-2 ring-[#9CCC65]' : 'bg-[#F5E6C8] text-[#8D6E63] hover:bg-[#E8D5B0]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>

          {/* Model */}
          <label className="text-[11px] text-[#8D6E63] mb-1.5 block">模型</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full h-9 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] mb-3 focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
          >
            {DEFAULT_MODELS[provider].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="_custom">自定义模型名...</option>
          </select>
          {model === '_custom' && (
            <input
              type="text"
              value=""
              onChange={(e) => setModel(e.target.value)}
              placeholder="输入模型名"
              className="w-full h-9 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] mb-3 placeholder-[#A1887F] focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
            />
          )}

          {/* API Key */}
          <div className="flex gap-2 mb-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={PROVIDER_INFO[provider].placeholder}
              className="flex-1 h-9 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] placeholder-[#8D6E63] focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
            />
            <button onClick={() => setShowKey(!showKey)} className="px-2 h-9 text-[10px] text-[#8D6E63]">{showKey ? '隐藏' : '显示'}</button>
            <button onClick={handleSaveLLM} className="px-3 h-9 bg-[#9CCC65] text-[#4E342E] text-xs font-medium rounded-2xl hover:bg-[#8BC34A] shadow-sm transition-colors">保存</button>
          </div>

          {provider === 'openai' && (
            <>
              <label className="text-[10px] text-[#8D6E63] mb-1 block">自定义接口地址（可选）</label>
              <input
                type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full h-8 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] placeholder-[#A1887F] focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
              />
              <p className="text-[10px] text-[#A1887F] mt-1">支持 Ollama (http://localhost:11434/v1/chat/completions)</p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider mb-3">数据概览</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-[#689F38]">{activeCount}</div><div className="text-[11px] text-[#8D6E63]">进行中</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#9CCC65]">{completedCount}</div><div className="text-[11px] text-[#8D6E63]">已完成</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#4E342E]">{totalThoughts}</div><div className="text-[11px] text-[#8D6E63]">念头</div></div>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8E6C9] flex items-center justify-center shadow-sm">
              <span className="text-lg font-extrabold text-[#689F38]">一</span>
            </div>
            <div>
              <h3 className="font-semibold text-[#4E342E] text-sm">一念 Pip</h3>
              <p className="text-[11px] text-[#8D6E63]">v3.0 · 闪念胶囊的速度 × AI 项目管理的深度</p>
            </div>
          </div>
          <p className="text-[11px] text-[#8D6E63] mt-3 leading-relaxed">
            一念（Pip）是你的智能项目管理伙伴。打开即记录，像闪念胶囊一样零摩擦捕捉想法，
            AI 自动帮你整理、归类、拆解任务，并主动告诉你该关注什么。
          </p>
        </div>

        {/* Danger zone */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider px-1">危险区域</h3>
          <button onClick={() => setShowReset(true)} className="w-full bg-[#FFFBEF] rounded-2xl p-3.5 flex items-center gap-3 text-left hover:bg-[#F5E6C8] transition-colors shadow-sm border border-[#E8D5B0]">
            <RotateCcw size={15} className="text-[#FFB74D]" />
            <div className="flex-1"><div className="text-xs font-medium text-[#4E342E]">重置为示例数据</div><div className="text-[10px] text-[#8D6E63]">恢复初始演示数据</div></div>
            <ChevronRight size={13} className="text-[#8D6E63]" />
          </button>
          <button onClick={() => setShowClear(true)} className="w-full bg-[#FFFBEF] rounded-2xl p-3.5 flex items-center gap-3 text-left hover:bg-[#FFECB3] transition-colors shadow-sm border border-[#E8D5B0]">
            <Trash2 size={15} className="text-[#EF9A9A]" />
            <div className="flex-1"><div className="text-xs font-medium text-[#4E342E]">清除所有数据</div><div className="text-[10px] text-[#8D6E63]">删除所有数据和记录，不可恢复</div></div>
            <ChevronRight size={13} className="text-[#8D6E63]" />
          </button>
        </div>

        {/* Modals */}
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#4E342E]/30" onClick={() => setShowReset(false)}>
            <div className="bg-[#FFFBEF] rounded-t-3xl w-full max-w-sm p-5 shadow-lg border border-[#E8D5B0]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2"><RotateCcw size={18} className="text-[#FFB74D]" /><h3 className="font-semibold text-[#4E342E]">重置数据</h3></div>
              <p className="text-sm text-[#8D6E63] mb-4">删除当前数据并恢复示例项目。此操作不可撤销。</p>
              <div className="flex gap-2">
                <button onClick={() => { resetAll(); setShowReset(false); }} className="flex-1 h-10 bg-[#FFB74D] text-[#4E342E] text-sm font-medium rounded-2xl">确认重置</button>
                <button onClick={() => setShowReset(false)} className="flex-1 h-10 bg-[#F5E6C8] text-[#4E342E] text-sm font-medium rounded-2xl">取消</button>
              </div>
            </div>
          </div>
        )}
        {showClear && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#4E342E]/30" onClick={() => setShowClear(false)}>
            <div className="bg-[#FFFBEF] rounded-t-3xl w-full max-w-sm p-5 shadow-lg border border-[#E8D5B0]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2"><Trash2 size={18} className="text-[#EF9A9A]" /><h3 className="font-semibold text-[#4E342E]">清除所有数据</h3></div>
              <p className="text-sm text-[#8D6E63] mb-4">永久删除所有数据和记录。此操作不可撤销。</p>
              <div className="flex gap-2">
                <button onClick={() => { resetData(); window.location.reload(); }} className="flex-1 h-10 bg-[#EF9A9A] text-[#4E342E] text-sm font-medium rounded-2xl">确认删除</button>
                <button onClick={() => setShowClear(false)} className="flex-1 h-10 bg-[#F5E6C8] text-[#4E342E] text-sm font-medium rounded-2xl">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Main layout ----

  return (
    <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-[#FFF8E1] border-b border-[#E8D5B0] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold text-[#4E342E] tracking-tight flex items-center gap-2">
            一念
            <Sparkles size={14} className="text-[#FFB74D]" />
            <span className="text-[10px] font-normal text-[#8D6E63] bg-[#F5E6C8] px-1.5 py-0.5 rounded-full">Pip</span>
          </h1>
          <p className="text-[11px] text-[#8D6E63] -mt-0.5">
            {tab === 'thoughts' && (unprocessedCount > 0 ? `${unprocessedCount} 条未整理念头` : '一切就绪')}
            {tab === 'projects' && `${activeProjects.filter((p) => !p.completed).length} 个进行中项目`}
            {tab === 'settings' && 'AI 配置 & 数据管理'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'thoughts' && (
            <button
              onClick={() => navigate('/review')}
              className="relative w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
            >
              <ListTodo size={18} className="text-[#8D6E63]" />
              {unprocessedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF9A9A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unprocessedCount > 9 ? '9+' : unprocessedCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'thoughts' && renderThoughtsTab()}
        {tab === 'projects' && renderProjectsTab()}
        {tab === 'settings' && renderSettingsTab()}
      </div>

      {/* Capture bar — only on thoughts tab */}
      {tab === 'thoughts' && <CaptureBar onCapture={handleCapture} />}

      {/* Bottom Tab Bar */}
      <div className="bg-[#FFFBEF] border-t border-[#E8D5B0] flex items-center justify-around px-2 pt-1 pb-[env(safe-area-inset-bottom,8px)]">
        {[
          { id: 'thoughts' as TabId, label: '念头', icon: Lightbulb },
          { id: 'projects' as TabId, label: '项目', icon: Star },
          { id: 'settings' as TabId, label: '设置', icon: Coffee },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-2xl transition-colors ${
                active ? 'text-[#689F38]' : 'text-[#8D6E63]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
