import React, { useEffect, useRef } from 'react';

interface ParticleTextProps {
  text: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: 'auto' | 'hover';
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  scattered: boolean;
  delay: number;
  color: string;
}

const ParticleText: React.FC<ParticleTextProps> = ({
  text,
  particleSize = 2,
  density = 4,
  color = '#ffffff',
  highlightColor = '#8b5cf6',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = 'hover',
  fontSize = 'clamp(3rem, 12vw, 8rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    particles: [] as Particle[],
    mouse: { x: -9999, y: -9999 },
    gathered: false,
    animId: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;
    const state = stateRef.current;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildParticles();
    };

    const buildParticles = () => {
      const w = canvas.width;
      const h = canvas.height;
      // Render text to off-screen canvas
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const offCtx = off.getContext('2d')!;
      offCtx.fillStyle = color;
      offCtx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, w / 2, h / 2);

      const imageData = offCtx.getImageData(0, 0, w, h).data;
      state.particles = [];

      for (let y = 0; y < h; y += density) {
        for (let x = 0; x < w; x += density) {
          const idx = (y * w + x) * 4;
          if (imageData[idx + 3] > 128) {
            const isHighlight = Math.random() < 0.12;
            const p: Particle = {
              originX: x,
              originY: y,
              x: trigger === 'auto'
                ? x + (Math.random() - 0.5) * scatter * 2
                : x,
              y: trigger === 'auto'
                ? y + (Math.random() - 0.5) * scatter * 2
                : y,
              vx: 0,
              vy: 0,
              scattered: trigger === 'auto',
              delay: trigger === 'auto' ? Math.random() * stagger : 0,
              color: isHighlight ? highlightColor : color,
            };
            state.particles.push(p);
          }
        }
      }

      if (trigger === 'auto') {
        // Auto gather after a short delay
        setTimeout(() => gather(), 200);
      } else {
        state.gathered = true;
      }
    };

    const gather = () => {
      state.gathered = true;
      const speed = gatherDuration / 1000;
      state.particles.forEach(p => {
        const eased = (t: number) => 1 - Math.pow(1 - t, 3);
        const startX = p.x;
        const startY = p.y;
        const startTime = performance.now() + p.delay;
        const animate = (now: number) => {
          if (now < startTime) {
            requestAnimationFrame(animate);
            return;
          }
          const t = Math.min((now - startTime) / (speed * 1000), 1);
          p.x = startX + (p.originX - startX) * eased(t);
          p.y = startY + (p.originY - startY) * eased(t);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      });
    };

    let driftT = 0;
    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      driftT = ts * 0.001;

      if (glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = highlightColor;
      }

      state.particles.forEach(p => {
        // Pointer repel
        const dx = p.x - state.mouse.x;
        const dy = p.y - state.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (state.gathered && dist < repelRadius) {
          const force = (1 - dist / repelRadius) * pointerRepel;
          p.vx += (dx / dist) * force * 0.1;
          p.vy += (dy / dist) * force * 0.1;
        }

        if (state.gathered) {
          // Spring back to origin with idle drift
          const drift = idleDrift * 0.3;
          const driftX = Math.sin(driftT * 0.8 + p.originX * 0.01) * drift;
          const driftY = Math.cos(driftT * 0.6 + p.originY * 0.01) * drift;

          p.vx += (p.originX + driftX - p.x) * 0.08;
          p.vy += (p.originY + driftY - p.y) * 0.08;
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.x += p.vx;
          p.y += p.vy;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      });

      if (glow) ctx.shadowBlur = 0;
      state.animId = requestAnimationFrame(draw);
    };

    state.animId = requestAnimationFrame(draw);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.mouse.x = e.clientX - rect.left;
      state.mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { state.mouse.x = -9999; state.mouse.y = -9999; };

    const onHover = () => {
      if (trigger === 'hover' && !state.gathered) {
        // scatter then gather
        state.particles.forEach(p => {
          p.x = p.originX + (Math.random() - 0.5) * scatter * 2;
          p.y = p.originY + (Math.random() - 0.5) * scatter * 2;
          p.scattered = true;
        });
        setTimeout(() => gather(), 100);
      }
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mouseenter', onHover);

    resize();

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mouseenter', onHover);
    };
  }, [text, particleSize, density, color, highlightColor, scatter, gatherDuration,
    stagger, pointerRepel, repelRadius, idleDrift, trigger, fontSize, fontWeight, fontFamily, glow]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default ParticleText;
