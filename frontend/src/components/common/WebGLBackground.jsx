/**
 * WebGLBackground — Interactive Live Developer Canvas Background
 * Soft lavender/indigo animated gradient mesh with interactive particle constellation
 * Color theme: #5B6EF5 (Indigo), #7C3AED (Violet), #06B6D4 (Cyan), #EC4899 (Pink)
 */
import { useEffect, useRef } from 'react';

const WebGLBackground = ({ intensity = 0.85 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx, animId, t = 0;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const orbs = [];
    const particles = [];
    let mouse = { x: 0.5, y: 0.5 };
    let targetMouse = { x: 0.5, y: 0.5 };

    const ORBS_CFG = [
      { color: [91, 110, 245],  alpha: 0.18 * intensity, r: 0.48, vx: 0.08, vy: 0.05, phase: 0.0 },
      { color: [124, 58, 237],  alpha: 0.16 * intensity, r: 0.42, vx: -0.07, vy: 0.09, phase: 1.2 },
      { color: [6, 182, 212],   alpha: 0.12 * intensity, r: 0.32, vx: 0.06, vy: -0.08, phase: 2.4 },
      { color: [236, 72, 153],  alpha: 0.10 * intensity, r: 0.28, vx: -0.05, vy: -0.07, phase: 3.6 },
      { color: [16, 185, 129],  alpha: 0.08 * intensity, r: 0.24, vx: 0.09, vy: 0.06, phase: 1.8 },
    ];

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initElements = () => {
      // Orbs
      orbs.length = 0;
      const s = Math.min(w, h);
      ORBS_CFG.forEach(cfg => {
        orbs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: cfg.r * s,
          vx: cfg.vx,
          vy: cfg.vy,
          color: cfg.color,
          alpha: cfg.alpha,
          phase: cfg.phase,
        });
      });

      // Interactive Constellation Particles
      particles.length = 0;
      const count = Math.min(Math.floor((w * h) / 24000), 45);
      const palette = [
        [91, 110, 245],
        [124, 58, 237],
        [6, 182, 212],
        [16, 185, 129],
      ];

      for (let i = 0; i < count; i++) {
        const col = palette[i % palette.length];
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.8 + 1.2,
          color: col,
          alpha: Math.random() * 0.35 + 0.25,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      t += 0.004;
      mouse.x += (targetMouse.x - mouse.x) * 0.05;
      mouse.y += (targetMouse.y - mouse.y) * 0.05;

      // 1. Base background
      ctx.fillStyle = '#F4F4FF';
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle architectural grid dots
      ctx.fillStyle = 'rgba(91,110,245,0.04)';
      const gs = 34;
      for (let x = 0; x < w; x += gs) {
        for (let y = 0; y < h; y += gs) {
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Ambient Fluid Orbs
      ctx.globalCompositeOperation = 'multiply';
      orbs.forEach(o => {
        o.x += o.vx + (mouse.x - 0.5) * 0.12;
        o.y += o.vy + (mouse.y - 0.5) * 0.10;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;

        const breathe = 0.92 + 0.08 * Math.sin(t * 0.6 + o.phase);
        const r = o.r * breathe;
        const [rr, gg, bb] = o.color;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
        g.addColorStop(0,    `rgba(${rr},${gg},${bb},${o.alpha * 1.6})`);
        g.addColorStop(0.45, `rgba(${rr},${gg},${bb},${o.alpha * 0.9})`);
        g.addColorStop(0.8,  `rgba(${rr},${gg},${bb},${o.alpha * 0.25})`);
        g.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`);

        ctx.beginPath();
        ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // 4. Interactive Constellation (particles + connecting lines)
      ctx.globalCompositeOperation = 'source-over';
      const maxDist = 120;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx + (mouse.x - 0.5) * 0.15;
        p.y += p.vy + (mouse.y - 0.5) * 0.15;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        p.pulse += 0.02;
        const currentAlpha = p.alpha * (0.8 + 0.2 * Math.sin(p.pulse));
        const [pr, pg, pb] = p.color;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${currentAlpha})`;
        ctx.fill();

        // Connect with nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${pr},${pg},${pb},${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // 5. Interactive Mouse Light
      const mouseX = mouse.x * w;
      const mouseY = mouse.y * h;
      const mouseGlow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280);
      mouseGlow.addColorStop(0, 'rgba(91,110,245,0.09)');
      mouseGlow.addColorStop(0.5, 'rgba(124,58,237,0.03)');
      mouseGlow.addColorStop(1, 'rgba(91,110,245,0)');
      ctx.fillStyle = mouseGlow;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    ctx = canvas.getContext('2d', { alpha: false });
    setup();
    initElements();
    draw();

    const onResize = () => { setup(); initElements(); };
    const onMouse  = e => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = e.clientY / window.innerHeight;
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default WebGLBackground;
