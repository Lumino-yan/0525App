import { useRef, useState, useEffect } from 'react';

interface Item {
  image: string;
  title: string;
  description: string;
}

const items: Item[] = [
  {
    image: '/images/dashboard-ui.jpg',
    title: '数据仪表盘',
    description: '实时监控项目指标，趋势一目了然',
  },
  {
    image: '/images/team-admin.jpg',
    title: '团队权限管理',
    description: '精细化角色分配，安全可控',
  },
  {
    image: '/images/hero-3d-panel.jpg',
    title: '任务空间视图',
    description: '三维沉浸式的任务浏览体验',
  },
];

export default function SequentialFadeIn() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2, rootMargin: '0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{ transitionDelay: `${index * 100}ms` }}
          className={`transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">{item.title}</h3>
              <p className="text-sm text-[#8E8E93]">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
