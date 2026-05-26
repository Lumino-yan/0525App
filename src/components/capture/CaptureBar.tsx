import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { ThoughtColor } from '../../lib/types';
import { Sparkles, Mic } from 'lucide-react';

const COLOR_OPTIONS: { color: ThoughtColor; dot: string; label: string }[] = [
  { color: null, dot: 'bg-[#D7CCC8]', label: '默认' },
  { color: 'red', dot: 'bg-[#EF9A9A]', label: '紧急' },
  { color: 'orange', dot: 'bg-[#FFB74D]', label: '待办' },
  { color: 'blue', dot: 'bg-[#81D4FA]', label: '记录' },
  { color: 'green', dot: 'bg-[#9CCC65]', label: '稍后' },
  { color: 'purple', dot: 'bg-[#CE93D8]', label: '灵感' },
];

interface CaptureBarProps {
  onCapture: (content: string, color: ThoughtColor) => void;
}

export default function CaptureBar({ onCapture }: CaptureBarProps) {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<ThoughtColor>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    onCapture(trimmed, selectedColor);
    setContent('');
    setSelectedColor(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="bg-[#FFFBEF] border-t border-[#E8D5B0] px-3 pt-3 pb-4">
      {/* Color dots */}
      <div className="flex justify-center gap-2 mb-2.5">
        {COLOR_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setSelectedColor(opt.color)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              selectedColor === opt.color
                ? 'ring-2 ring-[#9CCC65] ring-offset-1 scale-110'
                : 'hover:scale-105'
            }`}
            title={opt.label}
          >
            <span className={`w-4 h-4 rounded-full ${opt.dot}`} />
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 bg-[#FFF8E1] rounded-3xl px-4 py-2 border border-[#E8D5B0]">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="记个念头..."
          className="flex-1 bg-transparent text-[15px] text-[#4E342E] placeholder-[#8D6E63] outline-none"
          autoFocus
        />
        {/* Mic button — placeholder for voice input */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#8D6E63] hover:bg-[#F5E6C8] transition-colors"
          title="语音输入"
        >
          <Mic size={16} />
        </button>
      </div>

      {/* Send hint */}
      <p className="text-xs text-[#8D6E63] text-center mt-2 flex items-center justify-center gap-1">
        <Sparkles size={10} className="text-[#FFB74D]" />
        回车发送 · 选颜色标记意图
      </p>
    </div>
  );
}
