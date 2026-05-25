import type { Thought } from '../../lib/types';
import { COLOR_MAP, formatRelativeTime } from '../../lib/engine';

interface ThoughtBubbleProps {
  thought: Thought;
  onTap?: () => void;
  onLongPress?: () => void;
}

export default function ThoughtBubble({ thought, onTap, onLongPress }: ThoughtBubbleProps) {
  const colorInfo = thought.color ? COLOR_MAP[thought.color] : null;

  return (
    <button
      onClick={onTap}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(); }}
      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#F5E6C8]/50 transition-colors active:bg-[#F5E6C8]"
    >
      {/* Color dot */}
      <div className="mt-1.5 shrink-0">
        {colorInfo ? (
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorInfo.dot}`} />
        ) : (
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D7CCC8]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-[#4E342E] leading-snug line-clamp-2">
          {thought.content}
        </p>
        <span className="text-xs text-[#8D6E63] mt-1 block">
          {formatRelativeTime(thought.createdAt)}
          {thought.processed && ' · 已整理'}
        </span>
      </div>
    </button>
  );
}
