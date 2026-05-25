import LiquidMeshGradient from '../components/effects/LiquidMeshGradient';
import InterfaceShowcase from '../components/effects/InterfaceShowcase';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Shader Background */}
      <LiquidMeshGradient />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
              style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
            >
              <span className="text-white">将混沌</span>
              <br />
              <span className="text-gradient">凝练为秩序</span>
            </h1>

            <p className="text-base md:text-lg text-[#8E8E93] max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              智能整合你的任务、文档与团队动态。抛弃繁琐，专注于真正重要的交付。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="glow-button px-8 py-3.5 text-sm flex items-center justify-center gap-2 group">
                开始使用
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
              <button className="px-8 py-3.5 text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all duration-300">
                了解更多
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex gap-8 justify-center lg:justify-start">
              {[
                { value: '10K+', label: '活跃用户' },
                { value: '98%', label: '满意度' },
                { value: '<50ms', label: '响应速度' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#8E8E93] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Interface */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <InterfaceShowcase />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #050505, transparent)',
        }}
      />
    </section>
  );
}
