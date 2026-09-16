import React, { useEffect, useRef } from 'react';

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  speed?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
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

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
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

      ctx.save();
      if (blur > 0) ctx.filter = `blur(${blur}px)`;

      for (let i = 0; i < ringCount; i++) {
        const phase = (i / ringCount) * Math.PI * 2;
        const radiusFraction = baseRadius + i * radiusStep * ringGap;
        const baseR = minDim * radiusFraction;

        // Noise-like wobble per ring
        const noiseX = Math.sin(t * speed + phase) * noiseAmount * baseR;
        const noiseY = Math.cos(t * speed * 1.3 + phase) * noiseAmount * baseR;
        const rX = baseR + noiseX;
        const rY = baseR + noiseY;

        const progress = i / Math.max(ringCount - 1, 1);
        // Interpolate between color and colorTwo
        const r1 = parseInt(color.slice(1, 3), 16);
        const g1 = parseInt(color.slice(3, 5), 16);
        const b1 = parseInt(color.slice(5, 7), 16);
        const r2 = parseInt(colorTwo.slice(1, 3), 16);
        const g2 = parseInt(colorTwo.slice(3, 5), 16);
        const b2 = parseInt(colorTwo.slice(5, 7), 16);

        const ri = Math.round(r1 + (r2 - r1) * progress);
        const gi = Math.round(g1 + (g2 - g1) * progress);
        const bi = Math.round(b1 + (b2 - b1) * progress);

        // Ring opacity fades outer rings
        const ringAlpha = fadeOpacity * (1 - progress * 0.4);

        // Create gradient stroke around ring
        const grad = ctx.createLinearGradient(cx - rX, cy, cx + rX, cy);
        grad.addColorStop(0, `rgba(${ri},${gi},${bi},0)`);
        grad.addColorStop(0.3, `rgba(${ri},${gi},${bi},${ringAlpha})`);
        grad.addColorStop(0.7, `rgba(${ri},${gi},${bi},${ringAlpha})`);
        grad.addColorStop(1, `rgba(${ri},${gi},${bi},0)`);

        ctx.beginPath();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation + t * speed * 0.1 + phase * 0.1);
        ctx.scale(1, rY / rX); // Ellipse
        ctx.arc(0, 0, rX, 0, Math.PI * 2);
        ctx.restore();

        ctx.strokeStyle = grad;
        ctx.lineWidth = lineThickness;
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Add glow layer
        ctx.beginPath();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation + t * speed * 0.1 + phase * 0.1);
        ctx.scale(1, rY / rX);
        ctx.arc(0, 0, rX, 0, Math.PI * 2);
        ctx.restore();

        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(${ri},${gi},${bi},${ringAlpha * 0.6})`;
        ctx.strokeStyle = `rgba(${ri},${gi},${bi},${ringAlpha * 0.3})`;
        ctx.lineWidth = lineThickness * 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
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

    window.addEventListener('mousemove', onMouseMove);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
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
