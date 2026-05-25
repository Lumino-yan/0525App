import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../hooks/useApp';
import SuggestionGroup from '../components/review/SuggestionGroup';
import { generateId } from '../lib/engine';
import type { AIOrganizeResult, AIOrgSuggestion } from '../lib/types';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { data, organizeInbox, createProjectFromThoughts, addTask } = useApp();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIOrganizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unprocessed = data.thoughts.filter((t) => !t.processed);

  useEffect(() => {
    async function run() {
      if (unprocessed.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const r = await organizeInbox();
        setResult(r);
      } catch {
        setError('AI 整理失败，请检查 API Key 设置');
      }
      setLoading(false);
    }
    run();
  }, [organizeInbox]);

  function handleConfirmSuggestion(suggestion: AIOrgSuggestion) {
    if (!result) return;
    const project = createProjectFromThoughts(suggestion.suggestedName, suggestion.thoughtIds);

    // Create tasks from extracted tasks that reference this suggestion's thoughts
    const relatedTasks = result.extractedTasks.filter((t) =>
      t.thoughtIds.some((id) => suggestion.thoughtIds.includes(id)),
    );
    relatedTasks.forEach((t, i) => {
      addTask({
        id: generateId(),
        projectId: project.id,
        content: t.content,
        completed: false,
        order: i,
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#FFF8E1] border-b border-[#E8D5B0] px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#F5E6C8] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#8D6E63]" />
        </button>
        <div>
          <span className="text-[15px] font-semibold text-[#4E342E]">整理收件箱</span>
          <p className="text-[11px] text-[#8D6E63] -mt-0.5">
            {unprocessed.length} 条待整理念头
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Empty state */}
        {unprocessed.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-[#C8E6C9] flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-[#689F38]" />
            </div>
            <p className="text-[#4E342E] font-medium">收件箱已清空</p>
            <p className="text-xs text-[#8D6E63] mt-1">所有念头都已整理完毕</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="bg-[#FFECB3] rounded-2xl p-4">
              <div className="h-4 bg-[#E8D5B0]/50 rounded w-3/4 mb-2" />
              <div className="h-4 bg-[#E8D5B0]/50 rounded w-1/2" />
            </div>
            <div className="bg-[#FFFBEF] rounded-2xl p-4 h-32" />
            <div className="bg-[#FFFBEF] rounded-2xl p-4 h-32" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#FFECB3] rounded-2xl p-4 text-sm text-[#4E342E]">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Focus guidance */}
            {result.focusGuidance && (
              <div className="bg-[#FFECB3] rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <p className="text-sm text-[#4E342E] leading-relaxed">
                    {result.focusGuidance}
                  </p>
                </div>
              </div>
            )}

            {/* Project suggestions */}
            {result.projectSuggestions.length > 0 && (
              <div>
                <h3 className="text-xs text-[#8D6E63] font-medium mb-2 uppercase tracking-wider">
                  建议创建的项目
                </h3>
                <div className="space-y-3">
                  {result.projectSuggestions.map((s, i) => {
                    const relatedThoughts = s.thoughtIds
                      .map((id) => data.thoughts.find((t) => t.id === id))
                      .filter(Boolean) as typeof data.thoughts;

                    return (
                      <SuggestionGroup
                        key={i}
                        suggestion={s}
                        thoughts={relatedThoughts}
                        onConfirm={() => handleConfirmSuggestion(s)}
                        onDismiss={() => {}}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted tasks without project groups */}
            {result.extractedTasks.filter(
              (t) => !result.projectSuggestions.some((s) =>
                t.thoughtIds.some((id) => s.thoughtIds.includes(id)),
              ),
            ).length > 0 && (
              <div>
                <h3 className="text-xs text-[#8D6E63] font-medium mb-2 uppercase tracking-wider">
                  提取的待办事项
                </h3>
                <div className="bg-[#FFFBEF] rounded-2xl p-4 card-shadow space-y-2">
                  {result.extractedTasks
                    .filter(
                      (t) =>
                        !result.projectSuggestions.some((s) =>
                          t.thoughtIds.some((id) => s.thoughtIds.includes(id)),
                        ),
                    )
                    .map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-[#4E342E]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB74D] shrink-0" />
                        {t.content}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No results */}
            {result.projectSuggestions.length === 0 &&
              result.extractedTasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#8D6E63]">
                    AI 没有找到明确的归类建议
                  </p>
                  <p className="text-xs text-[#A1887F] mt-1">
                    你可以手动整理这些念头
                  </p>
                </div>
              )}
          </>
        )}

        {/* Retry button when no API */}
        {!result && !loading && !error && unprocessed.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[#8D6E63] mb-4">
              需要设置 API Key 才能使用 AI 整理
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex px-6 py-2.5 bg-[#9CCC65] text-[#4E342E] text-sm font-medium rounded-2xl hover:bg-[#8BC34A] transition-colors"
            >
              去设置
            </button>
          </div>
        )}

        {/* Done button */}
        {result && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#9CCC65] text-[#4E342E] text-sm font-semibold rounded-2xl hover:bg-[#8BC34A] transition-colors"
          >
            完成，回到首页
          </button>
        )}
      </div>
    </div>
  );
}
