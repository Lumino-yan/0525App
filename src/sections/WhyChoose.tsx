import ScrollTextReveal from '../components/effects/ScrollTextReveal';

export default function WhyChoose() {
  return (
    <section id="features" className="relative bg-[#050505] py-20">
      {/* Section label */}
      <div className="text-center mb-8">
        <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest">
          为什么选择 MOMENTA
        </span>
      </div>

      <ScrollTextReveal
        text="我们相信，真正的高效不是来自更多的工具，而是来自更聪明的工具。MOMENTA 通过智能任务调度与自动化进度追踪，让你从繁琐的管理中解放出来，把时间还给创造。每一个项目都是一次航行，我们为你掌舵。"
      />

      {/* Feature cards below */}
      <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: '智能任务调度',
            desc: '基于截止时间、优先级与工作负荷，自动为你安排最优的任务执行顺序。',
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            title: '自动进度追踪',
            desc: '告别手动更新。系统根据你的实际工作自动计算项目完成度。',
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            ),
          },
          {
            title: '团队实时协作',
            desc: '无缝的团队沟通与文件共享，让远程协作如同面对面一样高效。',
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-8 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:from-violet-500/30 group-hover:to-pink-500/30 transition-all duration-300">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
