import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Project {
  name: string;
  progress: number;
  deadline: string;
  color: string;
}

const projects: Project[] = [
  { name: '品牌视觉重塑', progress: 72, deadline: '2024.12.15', color: 'from-violet-600 via-purple-500 to-pink-500' },
  { name: '产品官网 3.0', progress: 45, deadline: '2024.11.30', color: 'from-indigo-500 via-violet-500 to-fuchsia-500' },
  { name: '移动端 App 重构', progress: 89, deadline: '2025.01.10', color: 'from-purple-600 via-pink-500 to-rose-500' },
  { name: '数据中台建设', progress: 30, deadline: '2025.02.28', color: 'from-fuchsia-600 via-purple-500 to-indigo-500' },
  { name: '国际化部署', progress: 60, deadline: '2025.01.20', color: 'from-violet-500 via-fuchsia-500 to-pink-500' },
];

export default function DiagonalProjectScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fixedWrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const scene = sceneRef.current;
    if (!container || !scene) return;

    const rotationX = 45;
    const rotationY = 0;
    const rotationZ = 45;
    const translateZ = -5000;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '+=150%',
        scrub: 1,
        pin: true,
      },
    });

    tl.set(scene, {
      rotationX,
      rotationY,
      rotationZ,
      translateZ,
      force3D: true,
      transformOrigin: '50% 50%',
    });

    tl.fromTo(
      scene.children,
      { autoAlpha: 0, y: '100%', rotationY: 120, rotationZ: 10, ease: 'power3.out' },
      { autoAlpha: 1, y: '0%', rotationY: 0, rotationZ: 0, stagger: 0.05, ease: 'power3.inOut' }
    );

    tl.to(scene, {
      rotationZ: 270,
      translateZ: 2000,
      ease: 'power3.inOut',
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100vh' }}>
      <div
        ref={fixedWrapperRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          ref={sceneRef}
          style={{
            perspective: '1000px',
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformStyle: 'preserve-3d',
          }}
        >
          {projects.map((project, i) => (
            <div
              key={i}
              data-depth={2 - i * 0.25}
              className={`absolute bg-gradient-to-br ${project.color} rounded-3xl shadow-2xl flex flex-col justify-end p-8`}
              style={{
                width: '320px',
                height: '420px',
                left: `${20 + (i % 3) * 25}%`,
                top: `${10 + (i % 2) * 30}%`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="glass-surface rounded-2xl p-5">
                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{project.deadline}</span>
                  <span className="text-sm font-semibold text-white">{project.progress}%</span>
                </div>
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
