import type { AIOrgSuggestion, Thought } from '../../lib/types';

interface SuggestionGroupProps {
  suggestion: AIOrgSuggestion;
  thoughts: Thought[];
  onConfirm?: () => void;
  onDismiss?: () => void;
}

export default function SuggestionGroup({
  suggestion,
  thoughts,
  onConfirm,
  onDismiss,
}: SuggestionGroupProps) {
  return (
    <div className="bg-[#FFFBEF] rounded-2xl p-4 card-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[#4E342E]">
            {suggestion.suggestedName}
          </h3>
          <p className="text-xs text-[#8D6E63] mt-0.5">{suggestion.reason}</p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C8E6C9] text-[#2E7D32] font-medium shrink-0 ml-2">
          建议项目
        </span>
      </div>

      {/* Thought previews */}
      <div className="space-y-1.5 mb-3">
        {thoughts.map((t) => (
          <div
            key={t.id}
            className="text-[13px] text-[#8D6E63] bg-[#FFF8E1] rounded-xl px-3 py-1.5"
          >
            {t.content}
          </div>
        ))}
        {suggestion.thoughtIds.length > thoughts.length && (
          <p className="text-xs text-[#A1887F]">
            +{suggestion.thoughtIds.length - thoughts.length} 条更多念头
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-2xl bg-[#9CCC65] text-white text-sm font-medium hover:bg-[#8BC34A] transition-colors active:bg-[#689F38]"
        >
          创建项目
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 rounded-2xl bg-[#F5E6C8] text-[#8D6E63] text-sm font-medium hover:bg-[#E8D5B0] transition-colors active:bg-[#D7CCC8]"
        >
          忽略
        </button>
      </div>
    </div>
  );
}
