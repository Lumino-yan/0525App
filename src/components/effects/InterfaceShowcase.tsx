import { useRef, useEffect, useState } from 'react';

export default function InterfaceShowcase() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / rect.width) * 15;
      const rotateX = -((e.clientY - centerY) / rect.height) * 15;
      setTilt({ x: rotateX, y: rotateY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="relative"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        ref={panelRef}
        className="relative rounded-3xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          width: '100%',
          maxWidth: '680px',
          aspectRatio: '16/10',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
          background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.95), rgba(10, 10, 15, 0.98))',
          border: '1px solid rgba(124, 58, 237, 0.15)',
          boxShadow: isHovering
            ? '0 25px 80px rgba(124, 58, 237, 0.2), 0 0 60px rgba(219, 39, 119, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-6 bg-white/5 rounded-md flex items-center px-3 text-xs text-white/30">
              momenta.app/dashboard
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-5 flex gap-4 h-full">
          {/* Sidebar */}
          <div className="w-14 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-white/10" />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/5 rounded" />
              </div>
              <div className="h-8 w-24 bg-white/5 rounded-lg" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="h-3 w-16 bg-white/10 rounded mb-3" />
                  <div className="h-8 w-12 bg-gradient-to-r from-violet-400 to-pink-400 rounded mb-3" style={{ opacity: 0.6 }} />
                  <div className="h-2 w-full bg-white/5 rounded mb-1" />
                  <div className="h-2 w-2/3 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300"
          style={{
            background: isHovering
              ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, transparent 50%, rgba(219, 39, 119, 0.05) 100%)'
              : 'none',
            opacity: isHovering ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
