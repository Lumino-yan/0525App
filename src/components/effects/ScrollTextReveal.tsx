import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollTextRevealProps {
  text: string;
}

export default function ScrollTextReveal({ text }: ScrollTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const words = text.split(' ');

  useEffect(() => {
    const wordsElements = textRef.current?.querySelectorAll('.word');
    if (!wordsElements || wordsElements.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 40%',
        scrub: true,
      },
    });

    tl.fromTo(
      wordsElements,
      { opacity: 0.2, transformOrigin: '100% 50%', transform: 'rotateY(40deg)' },
      { ease: 'none', opacity: 1, transform: 'rotateY(0deg)', stagger: 0.05 }
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto py-32 px-6">
      <h2
        ref={textRef}
        className="text-3xl md:text-5xl font-bold leading-tight tracking-tight"
        style={{ color: '#8E8E93' }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="word"
            style={{ perspective: '1000px' }}
          >
            {word}
          </span>
        ))}
      </h2>
    </div>
  );
}
