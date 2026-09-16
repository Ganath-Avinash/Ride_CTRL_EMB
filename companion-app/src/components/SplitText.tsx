import React, { useEffect, useRef, memo } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words';
  from?: Record<string, number | string>;
  to?: Record<string, number | string>;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  onLetterAnimationComplete?: () => void;
}

function toCssEase(ease: string): string {
  const map: Record<string, string> = {
    'power3.out': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    'power2.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'power1.out': 'cubic-bezier(0.33, 1, 0.68, 1)',
    'back.out(1.7)': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'expo.out': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'circ.out': 'cubic-bezier(0, 0.55, 0.45, 1)',
  };
  return map[ease] ?? 'cubic-bezier(0.215, 0.61, 0.355, 1)';
}

const SplitText: React.FC<SplitTextProps> = memo(({
  text,
  className = '',
  delay = 50,
  duration = 0.5,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 14 },
  to = { opacity: 1, y: 0 },
  threshold = 0.01,
  rootMargin = '50px',
  textAlign = 'left',
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    animated.current = false;

    const units = splitType === 'chars' ? text.split('') : text.split(' ');
    container.innerHTML = '';
    container.style.display = 'inline-block';
    container.style.textAlign = textAlign;

    const innerEls: HTMLSpanElement[] = [];

    units.forEach((unit, i) => {
      const outer = document.createElement('span');
      outer.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top';

      const inner = document.createElement('span');
      inner.style.cssText = `display:inline-block;opacity:${from.opacity ?? 0};transform:translateY(${from.y ?? 14}px) scale(${from.scale ?? 1});will-change:opacity,transform;`;
      inner.textContent = unit === ' ' ? '\u00A0' : unit;

      if (splitType === 'words' && i < units.length - 1) {
        outer.style.marginRight = '0.25em';
      }

      outer.appendChild(inner);
      container.appendChild(outer);
      innerEls.push(inner);
    });

    const cssEase = toCssEase(ease);

    const runAnimation = () => {
      if (animated.current) return;
      animated.current = true;

      innerEls.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = `opacity ${duration}s ${cssEase}, transform ${duration}s ${cssEase}`;
          el.style.opacity = String(to.opacity ?? 1);
          el.style.transform = `translateY(${to.y ?? 0}px) scale(${to.scale ?? 1})`;

          if (i === innerEls.length - 1) {
            setTimeout(() => onLetterAnimationComplete?.(), duration * 1000);
          }
        }, i * delay);
      });
    };

    // Use IntersectionObserver with fallback timer to guarantee execution
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            runAnimation();
            observer?.disconnect();
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(container);
    }

    // Safety fallback: if observer hasn't triggered within 150ms, animate anyway!
    const fallbackTimer = setTimeout(() => {
      if (!animated.current) {
        runAnimation();
        observer?.disconnect();
      }
    }, 150);

    return () => {
      clearTimeout(fallbackTimer);
      observer?.disconnect();
    };
  }, [text, delay, duration, ease, splitType, from, to, threshold, rootMargin, textAlign, onLetterAnimationComplete]);

  return <span ref={containerRef} className={className}>{text}</span>;
});

SplitText.displayName = 'SplitText';
export default SplitText;
