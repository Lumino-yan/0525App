import type { Task } from '../../lib/types';

interface TaskRowProps {
  task: Task;
  onToggle?: () => void;
  onDelete?: () => void;
}

export default function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 group hover:bg-[#F5E6C8]/30 transition-colors">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed
            ? 'bg-[#9CCC65] border-[#9CCC65]'
            : 'border-[#D7CCC8] hover:border-[#9CCC65]'
        }`}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <span className={`text-[15px] leading-snug flex-1 ${
        task.completed ? 'text-[#A1887F] line-through' : 'text-[#4E342E]'
      }`}>
        {task.content}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center rounded-full text-[#D7CCC8] hover:text-[#EF9A9A] hover:bg-[#FFEBEE] opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
