import React, { useEffect, useRef } from 'react';

interface BinaryRainBackgroundProps {
  opacity?: number;
  speed?: number;
  density?: number;
  colorTheme?: 'cyan-purple' | 'matrix-cyan' | 'neon-glow';
  className?: string;
}

export const BinaryRainBackground: React.FC<BinaryRainBackgroundProps> = ({
  opacity = 0.35,
  speed = 1,
  density = 22,
  colorTheme = 'cyan-purple',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Characters: heavy binary 0 and 1, plus subtle terminal runes
    const binaryChars = ['0', '1', '0', '1', '1', '0', '1', '0', '0', '1', '<', '>', '/', '{', '}', 'S', 'D', 'C'];

    const fontSize = 13;
    const columns = Math.ceil(width / density);
    
    // Each column's current vertical drop position
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -60));
    
    // Varied fall speeds for depth perception (foreground faster, background slower)
    const speeds: number[] = Array.from({ length: columns }, () => (0.4 + Math.random() * 0.7) * speed);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const targetInterval = 1000 / 32; // ~32 FPS for smooth retro cyber terminal aesthetic with negligible CPU footprint

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = currentTime - lastTime;
      if (delta < targetInterval) return;
      lastTime = currentTime - (delta % targetInterval);

      // Semi-transparent overlay to produce luminous trailing fade
      ctx.fillStyle = 'rgba(6, 14, 32, 0.14)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px 'JetBrains Mono', 'Fira Code', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = binaryChars[Math.floor(Math.random() * binaryChars.length)];
        const x = i * density;
        const y = drops[i] * fontSize;

        // Head character: bright glowing white / cyan sheen
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fillText(char, x, y);

        // Body trails: neon-purple and electric-cyan alternation
        if (colorTheme === 'cyan-purple') {
          ctx.fillStyle = i % 4 === 0 ? '#c084fc' : '#38bdf8';
          ctx.shadowColor = i % 4 === 0 ? '#a855f7' : '#0284c7';
          ctx.shadowBlur = 3;
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 3;
        }

        // Second char trail accent
        if (drops[i] > 1) {
          const trailChar = binaryChars[Math.floor(Math.random() * binaryChars.length)];
          ctx.fillText(trailChar, x, y - fontSize);
        }

        ctx.shadowBlur = 0;

        // Loop column when it hits bottom with slight randomized delay
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += speeds[i];
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, density, colorTheme]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ opacity }}
      />
      {/* Top, Bottom, and Radial Gradient Soft Vignettes so it blends behind text flawlessly */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060e20]/60 via-transparent to-[#060e20] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#060e20]/30 to-[#060e20]/85 pointer-events-none"></div>
    </div>
  );
};
