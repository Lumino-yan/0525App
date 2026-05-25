import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import { resetData } from '../lib/storage';
import { getStoredConfig, setLLMConfig, clearLLMConfig, type LLMProvider, type LLMConfig } from '../lib/llmService';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Key,
  Info,
  ChevronRight,
  Cpu,
  Globe,
  Server,
} from 'lucide-react';

const PROVIDER_INFO: Record<LLMProvider, { name: string; desc: string; placeholder: string }> = {
  anthropic: {
    name: 'Anthropic Claude',
    desc: '推荐使用，中文理解能力强，JSON 输出稳定',
    placeholder: 'sk-ant-...',
  },
  deepseek: {
    name: 'DeepSeek',
    desc: '性价比高，中文能力强，适合日常使用',
    placeholder: 'sk-...',
  },
  openai: {
    name: 'OpenAI / 兼容接口',
    desc: '支持 OpenAI、Ollama、vLLM 等兼容接口',
    placeholder: 'sk-...',
  },
};

const PROVIDER_ICONS: Record<LLMProvider, typeof Cpu> = {
  anthropic: Cpu,
  deepseek: Globe,
  openai: Server,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data, resetAll } = useApp();

  const savedConfig = getStoredConfig();
  const [provider, setProvider] = useState<LLMProvider>(savedConfig?.provider ?? 'anthropic');
  const [apiKey, setApiKeyState] = useState(savedConfig?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(savedConfig?.baseUrl ?? '');
  const [showKey, setShowKey] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const activeProjects = data.projects.filter((p) => !p.completed).length;
  const completedProjects = data.projects.filter((p) => p.completed).length;
  const totalThoughts = data.thoughts.length;

  function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      clearLLMConfig();
      return;
    }
    const config: LLMConfig = {
      provider,
      apiKey: trimmed,
    };
    if (provider === 'openai' && baseUrl.trim()) {
      config.baseUrl = baseUrl.trim();
    }
    setLLMConfig(config);
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="bg-[#FFF8E1] border-b border-[#E8D5B0] px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#8D6E63]" />
        </button>
        <span className="text-[15px] font-semibold text-[#4E342E]">设置</span>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* AI Provider */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} className="text-[#689F38]" />
            <h3 className="text-sm font-semibold text-[#4E342E]">AI 服务配置</h3>
          </div>
          <p className="text-[11px] text-[#8D6E63] mb-3">
            选择 AI 服务商并填入 API Key。不设置也能使用基础功能。
          </p>

          {/* Provider selector */}
          <div className="mb-3">
            <label className="text-[11px] text-[#8D6E63] mb-1.5 block">服务商</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map((p) => {
                const Icon = PROVIDER_ICONS[p];
                const info = PROVIDER_INFO[p];
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl text-xs transition-colors ${
                      provider === p
                        ? 'bg-[#C8E6C9] text-[#2E7D32] font-medium ring-2 ring-[#9CCC65]'
                        : 'bg-[#F5E6C8] text-[#8D6E63] hover:bg-[#E8D5B0]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#A1887F] mt-1.5">
              {PROVIDER_INFO[provider].desc}
            </p>
          </div>

          {/* API Key */}
          <div className="flex gap-2 mb-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder={PROVIDER_INFO[provider].placeholder}
              className="flex-1 h-9 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] placeholder:text-[#8D6E63] focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-2 h-9 text-[10px] text-[#8D6E63] hover:text-[#4E342E]"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
            <button
              onClick={handleSave}
              className="px-3 h-9 bg-[#9CCC65] text-[#4E342E] text-xs font-medium rounded-2xl hover:bg-[#8BC34A] shadow-sm transition-colors"
            >
              保存
            </button>
          </div>

          {/* Custom base URL for OpenAI-compatible */}
          {provider === 'openai' && (
            <div>
              <label className="text-[10px] text-[#8D6E63] mb-1 block">自定义接口地址（可选）</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full h-8 px-3 bg-[#F5E6C8] rounded-2xl border border-[#E8D5B0] text-xs text-[#4E342E] placeholder:text-[#A1887F] focus:outline-none focus:ring-2 focus:ring-[#9CCC65]/30"
              />
              <p className="text-[10px] text-[#A1887F] mt-1">
                支持 Ollama (http://localhost:11434/v1/chat/completions)、vLLM 等
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider mb-3">
            数据概览
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#689F38]">
                {activeProjects}
              </div>
              <div className="text-[11px] text-[#8D6E63]">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#9CCC65]">
                {completedProjects}
              </div>
              <div className="text-[11px] text-[#8D6E63]">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4E342E]">
                {totalThoughts}
              </div>
              <div className="text-[11px] text-[#8D6E63]">念头</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8E6C9] flex items-center justify-center shadow-sm">
              <span className="text-lg font-extrabold text-[#689F38]">一</span>
            </div>
            <div>
              <h3 className="font-semibold text-[#4E342E] text-sm">
                一念 Pip
              </h3>
              <p className="text-[11px] text-[#8D6E63]">
                v3.0 · 闪念胶囊的速度 × AI 项目管理的深度
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#8D6E63] mt-3 leading-relaxed">
            一念（Pip）是你的智能项目管理伙伴。打开即记录，像闪念胶囊一样零摩擦捕捉想法，
            AI 自动帮你整理、归类、拆解任务，并主动告诉你该关注什么。记录和整理彻底分离，
            不再被分类和标签打断思路。
          </p>
        </div>

        {/* How it works */}
        <div className="bg-[#FFFBEF] rounded-2xl p-4 shadow-sm border border-[#E8D5B0]">
          <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider mb-3">
            工作原理
          </h3>
          <div className="space-y-3">
            {[
              {
                title: '闪念捕捉',
                desc: '打开即记录，一键保存想法。无需分类、不打断思路，回头再整理',
              },
              {
                title: 'AI 智能整理',
                desc: 'AI 分析积攒的念头，自动建议项目归类、提取待办事项、给出行动指引',
              },
              {
                title: '本地存储',
                desc: '所有数据保存在设备本地，API Key 仅用于 AI 整理和建议',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <Info size={14} className="text-[#9CCC65] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#4E342E]">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#8D6E63] leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider px-1">
            危险区域
          </h3>

          <button
            onClick={() => setShowReset(true)}
            className="w-full bg-[#FFFBEF] rounded-2xl p-3.5 flex items-center gap-3 text-left hover:bg-[#F5E6C8] transition-colors shadow-sm border border-[#E8D5B0]"
          >
            <RotateCcw size={15} className="text-[#FFB74D]" />
            <div className="flex-1">
              <div className="text-xs font-medium text-[#4E342E]">
                重置为示例数据
              </div>
              <div className="text-[10px] text-[#8D6E63]">
                恢复初始演示数据
              </div>
            </div>
            <ChevronRight size={13} className="text-[#8D6E63]" />
          </button>

          <button
            onClick={() => setShowClear(true)}
            className="w-full bg-[#FFFBEF] rounded-2xl p-3.5 flex items-center gap-3 text-left hover:bg-[#FFECB3] transition-colors shadow-sm border border-[#E8D5B0]"
          >
            <Trash2 size={15} className="text-[#EF9A9A]" />
            <div className="flex-1">
              <div className="text-xs font-medium text-[#4E342E]">
                清除所有数据
              </div>
              <div className="text-[10px] text-[#8D6E63]">
                删除所有项目和记录，不可恢复
              </div>
            </div>
            <ChevronRight size={13} className="text-[#8D6E63]" />
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#4E342E]/30 sm:items-center"
          onClick={() => setShowReset(false)}
        >
          <div
            className="bg-[#FFFBEF] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 shadow-lg border border-[#E8D5B0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={18} className="text-[#FFB74D]" />
              <h3 className="font-semibold text-[#4E342E]">重置数据</h3>
            </div>
            <p className="text-sm text-[#8D6E63] mb-4">
              删除当前数据并恢复示例项目。此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetAll();
                  setShowReset(false);
                }}
                className="flex-1 h-10 bg-[#FFB74D] text-[#4E342E] text-sm font-medium rounded-2xl hover:bg-[#FFA726] transition-colors shadow-sm"
              >
                确认重置
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 h-10 bg-[#F5E6C8] text-[#4E342E] text-sm font-medium rounded-2xl hover:bg-[#E8D5B0] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Modal */}
      {showClear && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#4E342E]/30 sm:items-center"
          onClick={() => setShowClear(false)}
        >
          <div
            className="bg-[#FFFBEF] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 shadow-lg border border-[#E8D5B0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={18} className="text-[#EF9A9A]" />
              <h3 className="font-semibold text-[#4E342E]">清除所有数据</h3>
            </div>
            <p className="text-sm text-[#8D6E63] mb-4">
              永久删除所有项目和记录。此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetData();
                  window.location.reload();
                }}
                className="flex-1 h-10 bg-[#EF9A9A] text-[#4E342E] text-sm font-medium rounded-2xl hover:bg-[#E57373] transition-colors shadow-sm"
              >
                确认删除
              </button>
              <button
                onClick={() => setShowClear(false)}
                className="flex-1 h-10 bg-[#F5E6C8] text-[#4E342E] text-sm font-medium rounded-2xl hover:bg-[#E8D5B0] transition-colors"
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
