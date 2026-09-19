import React, { useEffect, useRef } from 'react';

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  speed?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
}

// Parse hex color once, outside the draw loop
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const MagicRings: React.FC<MagicRingsProps> = ({
  color = '#fc42ff',
  colorTwo = '#42fcff',
  ringCount = 6,
  speed = 1,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  followMouse = false,
  mouseInfluence = 0.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;

    let t = 0;
    let fadeOpacity = 0;
    const fadeSpeed = fadeIn > 0 ? 1 / (fadeIn * 60) : 1;

    // Pre-parse colors ONCE — not per frame
    const c1 = parseHex(color);
    const c2 = parseHex(colorTwo);

    // Pre-compute per-ring color RGB values
    const ringColors: [number, number, number][] = [];
    for (let i = 0; i < ringCount; i++) {
      const progress = i / Math.max(ringCount - 1, 1);
      ringColors.push([
        Math.round(c1[0] + (c2[0] - c1[0]) * progress),
        Math.round(c1[1] + (c2[1] - c1[1]) * progress),
        Math.round(c1[2] + (c2[2] - c1[2]) * progress),
      ]);
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      fadeOpacity = Math.min(fadeOpacity + fadeSpeed, opacity);

      const cx = w * (followMouse ? lerp(0.5, mouse.current.x, mouseInfluence) : 0.5);
      const cy = h * (followMouse ? lerp(0.5, mouse.current.y, mouseInfluence) : 0.5);
      const minDim = Math.min(w, h);

      // Apply blur once on the entire context, not per-ring
      if (blur > 0) ctx.filter = `blur(${blur}px)`;

      for (let i = 0; i < ringCount; i++) {
        const phase = (i / ringCount) * Math.PI * 2;
        const radiusFraction = baseRadius + i * radiusStep * ringGap;
        const baseR = minDim * radiusFraction;

        const noiseX = Math.sin(t * speed + phase) * noiseAmount * baseR;
        const noiseY = Math.cos(t * speed * 1.3 + phase) * noiseAmount * baseR;
        const rX = baseR + noiseX;
        const rY = baseR + noiseY;

        // Use pre-computed ring colors
        const [ri, gi, bi] = ringColors[i];
        const progress = i / Math.max(ringCount - 1, 1);
        const ringAlpha = fadeOpacity * (1 - progress * 0.4);
        const angle = rotation + t * speed * 0.1 + phase * 0.1;

        // Single-pass: linear gradient with glow baked via lineWidth — no shadowBlur
        const grad = ctx.createLinearGradient(cx - rX, cy, cx + rX, cy);
        grad.addColorStop(0,   `rgba(${ri},${gi},${bi},0)`);
        grad.addColorStop(0.3, `rgba(${ri},${gi},${bi},${ringAlpha})`);
        grad.addColorStop(0.7, `rgba(${ri},${gi},${bi},${ringAlpha})`);
        grad.addColorStop(1,   `rgba(${ri},${gi},${bi},0)`);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(1, rY / rX);
        ctx.beginPath();
        ctx.arc(0, 0, rX, 0, Math.PI * 2);
        ctx.restore();

        ctx.strokeStyle = grad;
        ctx.lineWidth = lineThickness;
        ctx.globalAlpha = 1;
        ctx.stroke();
        // No second shadowBlur pass — removes the heaviest per-frame cost
      }

      if (blur > 0) ctx.filter = 'none';

      t += 0.016;
      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!followMouse) return;
      const rect = container.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top) / rect.height;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // Pause when tab hidden
    let isPageVisible = !document.hidden;
    let isPaused = false;
    const startRaf = () => { if (!isPaused) rafRef.current = requestAnimationFrame(draw); };
    const onVis = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible && isPaused) { isPaused = false; startRaf(); }
      else if (!isPageVisible && !isPaused) { isPaused = true; cancelAnimationFrame(rafRef.current); }
    };
    document.addEventListener('visibilitychange', onVis);

    // Pause via IntersectionObserver
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && isPaused) { isPaused = false; startRaf(); }
      else if (!e.isIntersecting && !isPaused) { isPaused = true; cancelAnimationFrame(rafRef.current); }
    }, { threshold: 0 });
    io.observe(container);

    if (followMouse) window.addEventListener('mousemove', onMouseMove);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (followMouse) window.removeEventListener('mousemove', onMouseMove);
    };
  }, [color, colorTwo, ringCount, speed, lineThickness, baseRadius, radiusStep,
    opacity, blur, noiseAmount, rotation, ringGap, fadeIn, followMouse, mouseInfluence]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default MagicRings;
