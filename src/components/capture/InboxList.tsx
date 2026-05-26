import type { Thought } from '../../lib/types';
import { groupThoughtsByDate } from '../../lib/engine';
import ThoughtBubble from './ThoughtBubble';
import { Lightbulb, Sparkles } from 'lucide-react';

interface InboxListProps {
  thoughts: Thought[];
  onThoughtTap?: (thought: Thought) => void;
  onThoughtLongPress?: (thought: Thought) => void;
  variant?: 'inbox' | 'all';
}

export default function InboxList({ thoughts, onThoughtTap, onThoughtLongPress, variant = 'all' }: InboxListProps) {
  if (thoughts.length === 0) {
    if (variant === 'inbox') {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FFECB3] flex items-center justify-center mb-3 shadow-sm">
            <Sparkles size={28} className="text-[#FFB74D]" />
          </div>
          <p className="text-[#8D6E63] text-[15px]">收件箱是空的</p>
          <p className="text-[#A1887F] text-xs mt-1">太棒了，所有念头都已整理完毕</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-3xl bg-[#C8E6C9] flex items-center justify-center mb-3 shadow-sm">
          <Lightbulb size={28} className="text-[#689F38]" />
        </div>
        <p className="text-[#8D6E63] text-[15px]">还没有念头</p>
        <p className="text-[#A1887F] text-xs mt-1">在下方输入框记录你的第一个念头吧</p>
      </div>
    );
  }

  const groups = groupThoughtsByDate(thoughts);

  return (
    <div className="divide-y divide-[#E8D5B0]/50">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-4 py-2 bg-[#FFF8E1]/80 sticky top-0">
            <span className="text-xs text-[#8D6E63] font-medium">{group.label}</span>
          </div>
          {group.items.map((thought) => (
            <ThoughtBubble
              key={thought.id}
              thought={thought}
              onTap={() => onThoughtTap?.(thought)}
              onLongPress={() => onThoughtLongPress?.(thought)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
