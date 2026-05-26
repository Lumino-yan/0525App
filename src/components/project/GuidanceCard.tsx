import { Sparkles } from 'lucide-react';

interface GuidanceCardProps {
  guidance: string | null;
  loading?: boolean;
  onTap?: () => void;
}

export default function GuidanceCard({ guidance, loading, onTap }: GuidanceCardProps) {
  if (loading) {
    return (
      <div className="mx-4 mt-4 bg-[#FFECB3] rounded-2xl p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFB74D]/20 shrink-0 mt-0.5 flex items-center justify-center">
            <Sparkles size={14} className="text-[#FFB74D]/40" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E8D5B0]/50 rounded w-3/4" />
            <div className="h-4 bg-[#E8D5B0]/50 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!guidance) return null;

  return (
    <button
      onClick={onTap}
      className="mx-4 mt-4 w-[calc(100%-2rem)] bg-[#FFECB3] rounded-2xl p-4 text-left hover:bg-[#FFE082] transition-colors active:bg-[#FFD54F]"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FFB74D]/20 shrink-0 mt-0.5 flex items-center justify-center">
          <Sparkles size={16} className="text-[#FFB74D]" />
        </div>
        <div>
          <p className="text-sm text-[#4E342E] leading-relaxed">{guidance}</p>
          <span className="text-xs text-[#8D6E63] mt-1.5 block">
            点击整理收件箱
          </span>
        </div>
      </div>
    </button>
  );
}
