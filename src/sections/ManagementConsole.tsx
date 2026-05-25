import SequentialFadeIn from '../components/effects/SequentialFadeIn';
import { Check } from 'lucide-react';

export default function ManagementConsole() {
  return (
    <section id="console" className="relative bg-[#F3F3F1] py-32 md:py-40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest">
            管理后台
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight">
            掌控一切，井然有序
          </h2>
          <p className="mt-4 text-[#8E8E93] max-w-lg mx-auto">
            从数据概览到团队权限，所有管理功能一目了然
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {[
            '实时数据仪表盘',
            '精细化权限控制',
            '操作日志追踪',
            '团队绩效分析',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"
            >
              <Check size={14} className="text-violet-500" />
              <span className="text-sm text-[#1A1A1A]">{item}</span>
            </div>
          ))}
        </div>

        {/* Cards Grid with stagger animation */}
        <SequentialFadeIn />
      </div>
    </section>
  );
}
