import type { Project } from './types';
import { getMessagesForProject } from './storage';

const API_KEY_STORAGE_KEY = 'momenta_llm_api_key';

function getApiKey(): string {
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (stored) return stored;
  return import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

const SYSTEM_PROMPT = `你是 Momenta，一个智能项目管理助手。你的风格是主动、简洁、有帮助的，像一个经验丰富的项目经理。

当用户发消息时，你需要解析意图并返回 JSON。可能的意图：
- "log": 用户在记录项目进展
- "create": 用户想创建新项目
- "query": 用户在询问项目状态
- "unknown": 无法判断

返回格式必须是严格的 JSON（不要包含 markdown 标记）：
{
  "intent": "log" | "create" | "query" | "unknown",
  "confidence": 0.0-1.0,
  "extracted": {
    "projectName": "从消息中提取的项目名（仅 create 意图）",
    "urgency": "low" | "medium" | "high" | "critical" | null,
    "deadline": "ISO date string or null",
    "progressNote": "进展内容的简洁总结（仅 log 意图）",
    "suggestion": "对用户的下一步建议（仅 log 意图）",
    "progressEstimate": 0-100 的进度估算（仅 log 意图，可选）
  },
  "reply": "给用户的自然语言回复"
}`;

interface LLMResponse {
  intent: 'log' | 'create' | 'query' | 'unknown';
  confidence: number;
  extracted: {
    projectName?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical' | null;
    deadline?: string | null;
    progressNote?: string;
    suggestion?: string;
    progressEstimate?: number;
  };
  reply: string;
}

export async function parseMessage(
  content: string,
  context: {
    projectId?: string;
    project?: Project | null;
    isNewChat?: boolean;
  }
): Promise<LLMResponse | null> {
  if (!hasApiKey()) return null;

  const contextMessages = context.project
    ? getMessagesForProject(context.project.id).slice(-10)
    : [];

  const contextStr = context.project
    ? `当前项目：${context.project.name}
项目描述：${context.project.description}
优先级：${context.project.urgency}
截止日期：${context.project.deadline ?? '未设置'}
已完成：${context.project.completed ? '是' : '否'}
最近消息：${contextMessages.map((m) => `[${m.role}] ${m.content}`).join('\n')}`
    : '尚未创建项目';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `上下文：\n${contextStr}\n\n用户消息：${content}\n\n${
              context.isNewChat ? '注意：这是一个新项目创建场景，请用 create 意图解析。' : ''
            }`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('LLM API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as LLMResponse;
  } catch (err) {
    console.warn('LLM call failed:', err);
    return null;
  }
}

export async function generateProjectSummary(project: Project): Promise<string | null> {
  if (!hasApiKey()) return null;

  const messages = getMessagesForProject(project.id);
  const logMessages = messages.filter((m) => m.type === 'log');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: '你是一个项目管理助手。根据项目信息生成简洁的中文项目状态总结。',
        messages: [
          {
            role: 'user',
            content: `项目：${project.name}\n描述：${project.description}\n优先级：${project.urgency}\n截止日期：${project.deadline ?? '未设置'}\n进展记录：${logMessages.map((m) => m.content).join('；')}\n\n请用2-3句话总结当前项目状态。`,
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
