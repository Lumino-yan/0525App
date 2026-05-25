import DiagonalProjectScroll from '../components/effects/DiagonalProjectScroll';

export default function ProjectSpace() {
  return (
    <section id="projects" className="relative bg-[#050505]">
      {/* Section Header */}
      <div className="relative z-20 text-center pt-32 pb-16 px-6">
        <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-widest">
          项目空间
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight">
          多维视角，一览全局
        </h2>
        <p className="mt-4 text-[#8E8E93] max-w-lg mx-auto">
          在三维空间中穿梭浏览你的所有项目，每一个维度都是一次全新的洞察
        </p>
      </div>

      {/* 3D Scroll Area */}
      <DiagonalProjectScroll />

      {/* Bottom spacing */}
      <div className="h-32" />
    </section>
  );
}
