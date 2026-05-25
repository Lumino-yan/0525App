import type { Thought, Project } from './types';

// ---- Provider types ----

export type LLMProvider = 'anthropic' | 'deepseek' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string; // for OpenAI-compatible custom endpoints
  model?: string;   // override default model
}

const PROVIDER_STORAGE_KEY = 'pip_llm_provider';

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-haiku-4-5-20251001',
  deepseek: 'deepseek-chat',
  openai: 'gpt-4o-mini',
};

// ---- Config management ----

function getConfig(): LLMConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LLMConfig;
  } catch { /* ignore */ }
  return null;
}

function saveConfig(config: LLMConfig): void {
  localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(config));
}

export function getStoredConfig(): LLMConfig | null {
  return getConfig();
}

export function setLLMConfig(config: LLMConfig): void {
  saveConfig(config);
}

export function clearLLMConfig(): void {
  localStorage.removeItem(PROVIDER_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  const config = getConfig();
  if (config?.apiKey) return true;
  // Fallback: check legacy Anthropic-only key and .env
  const legacy = localStorage.getItem('momenta_llm_api_key');
  if (legacy) return true;
  return !!(import.meta.env.VITE_ANTHROPIC_API_KEY);
}

// ---- API Key resolution ----

function resolveApiKey(): string {
  const config = getConfig();
  if (config?.apiKey) return config.apiKey;
  // Legacy
  const legacy = localStorage.getItem('momenta_llm_api_key');
  if (legacy) return legacy;
  return import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
}

function resolveProvider(): LLMProvider {
  const config = getConfig();
  if (config?.provider) return config.provider;
  return 'anthropic';
}

function resolveModel(): string {
  const config = getConfig();
  if (config?.model) return config.model;
  return DEFAULT_MODELS[resolveProvider()];
}

function resolveBaseUrl(): string | undefined {
  const config = getConfig();
  if (config?.baseUrl) return config.baseUrl;
  return undefined;
}

// ---- Legacy compatibility (kept for SettingsPage migration) ----

/** @deprecated Use setLLMConfig instead */
export function setApiKey(key: string): void {
  const config = getConfig();
  if (config) {
    saveConfig({ ...config, apiKey: key });
  } else {
    saveConfig({ provider: 'anthropic', apiKey: key });
  }
}

/** @deprecated Use getStoredConfig instead */
export function getStoredApiKey(): string {
  return getConfig()?.apiKey ?? '';
}

// ---- LLM call routing ----

interface LLMCallOptions {
  system: string;
  userMessage: string;
  maxTokens: number;
}

async function callLLM(opts: LLMCallOptions): Promise<string | null> {
  const provider = resolveProvider();
  const apiKey = resolveApiKey();
  const model = resolveModel();

  if (!apiKey) return null;

  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, model, opts);
    case 'deepseek':
      return callOpenAICompatible('https://api.deepseek.com/v1/chat/completions', apiKey, model, opts);
    case 'openai':
      return callOpenAICompatible(
        resolveBaseUrl() || 'https://api.openai.com/v1/chat/completions',
        apiKey,
        model,
        opts,
      );
    default:
      return null;
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  opts: LLMCallOptions,
): Promise<string | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: 'user', content: opts.userMessage }],
      }),
    });

    if (!response.ok) {
      console.warn('Anthropic API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? null;
  } catch (err) {
    console.warn('Anthropic call failed:', err);
    return null;
  }
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  opts: LLMCallOptions,
): Promise<string | null> {
  try {
    const messages = [
      { role: 'system' as const, content: opts.system },
      { role: 'user' as const, content: opts.userMessage },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.warn('LLM API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn('LLM call failed:', err);
    return null;
  }
}

// ---- Pip prompts ----

const PIP_ORGANIZE_PROMPT = `你是 Pip（一念），一个智能项目管理助手。你的风格是简洁、温和、有洞察力的，像一个细心的伙伴。

用户会给你一系列"念头"（Thought）——他们快速记录的想法、待办、灵感。你需要分析这些念头，做三件事：

1. 找出可以归为一组的念头，建议创建一个"项目"来管理它们
2. 从念头中提取出明确的"待办事项"
3. 给出一条简短的整体引导建议（1-2句中文），告诉用户当前该关注什么

返回格式必须是严格的 JSON（不要包含 markdown 标记）：
{
  "projectSuggestions": [
    {
      "type": "project_group",
      "suggestedName": "建议的项目名称",
      "thoughtIds": ["th-xxx", "th-yyy"],
      "reason": "为什么这几个念头可以归为一个项目"
    }
  ],
  "extractedTasks": [
    {
      "type": "task",
      "content": "具体的待办事项内容",
      "thoughtIds": ["th-xxx"],
      "suggestedProjectId": "如果这个任务属于已有项目，填项目ID，否则 null"
    }
  ],
  "focusGuidance": "1-2句整体建议，告诉用户当前最该关注什么"
}

注意：
- 不要强行归类——如果某个念头确实独立，就不要硬塞进某个组
- 项目名应该简洁有意义，不是完整的句子
- focusGuidance 要具体，不要泛泛而谈
- 如果念头很少或者没有明确关联，projectSuggestions 和 extractedTasks 可以是空数组`;

// ---- Exported AI functions ----

export async function organizeInbox(
  thoughts: Thought[],
  existingProjects: Project[],
): Promise<import('./types').AIOrganizeResult | null> {
  if (!hasApiKey() || thoughts.length === 0) return null;

  const thoughtsStr = thoughts
    .map((t) => `[${t.id}] ${t.content}${t.color ? ` (标记: ${t.color})` : ''}`)
    .join('\n');

  const projectsStr = existingProjects
    .map((p) => `[${p.id}] ${p.name} — ${p.aiSummary || p.description}`)
    .join('\n');

  const text = await callLLM({
    system: PIP_ORGANIZE_PROMPT,
    userMessage: `现有项目：\n${projectsStr || '暂无'}\n\n待整理的念头：\n${thoughtsStr}`,
    maxTokens: 800,
  });

  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function generateProjectGuidance(project: Project): Promise<string | null> {
  if (!hasApiKey()) return null;

  const tasks = project.tasks ?? [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const nextTask = tasks.find((t) => !t.completed);

  return callLLM({
    system: '你是 Pip，一个简洁的项目管理助手。用1-2句中文给出项目推进建议，要具体、可执行。',
    userMessage: `项目：${project.name}\n描述：${project.description}\n优先级：${project.urgency}\n截止日期：${project.deadline ?? '未设置'}\n任务进度：${completedCount}/${totalCount} 完成\n${nextTask ? `下一步：${nextTask.content}` : '所有任务已完成'}`,
    maxTokens: 200,
  });
}

export async function generateFocusGuidance(
  thoughts: Thought[],
  projects: Project[],
): Promise<string | null> {
  if (!hasApiKey()) return null;

  const activeProjects = projects.filter((p) => !p.completed);
  const unprocessedCount = thoughts.filter((t) => !t.processed).length;

  return callLLM({
    system: '你是 Pip，一个简洁的项目管理助手。用1-2句中文告诉用户当前该关注什么。要具体、温暖、可执行。',
    userMessage: `进行中的项目：${activeProjects.map((p) => `${p.name}(优先级:${p.urgency}, 截止:${p.deadline ?? '无'})`).join('；')}\n未整理的念头：${unprocessedCount} 条`,
    maxTokens: 200,
  });
}
