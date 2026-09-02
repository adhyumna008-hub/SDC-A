import React from 'react';

export const MinimalCyberBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#06070a]">
      {/* 1. Volumetric Aurora Beam (Inspired by Pin 1 - GCore) */}
      <div 
        className="absolute -top-32 right-[-10%] sm:right-[5%] w-[600px] sm:w-[900px] h-[550px] sm:h-[750px] rotate-[-28deg] rounded-full pointer-events-none opacity-85"
        style={{
          background: `conic-gradient(
            from 230deg at 70% 30%,
            rgba(249, 115, 22, 0.42) 0deg,
            rgba(168, 85, 247, 0.35) 60deg,
            rgba(14, 165, 233, 0.22) 130deg,
            transparent 220deg
          )`,
          filter: 'blur(90px)',
        }}
      />

      {/* 2. Primary Aurora Core Gradient Mesh (Floating deep violet & neon purple bloom) */}
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[850px] sm:w-[1250px] h-[550px] sm:h-[700px] rounded-full blur-[140px] pointer-events-none opacity-75 animate-pulse"
        style={{
          background: `radial-gradient(
            ellipse at 50% 45%,
            rgba(124, 58, 237, 0.28) 0%,
            rgba(168, 85, 247, 0.18) 35%,
            rgba(14, 165, 233, 0.10) 65%,
            transparent 85%
          )`,
          animationDuration: '6s'
        }}
      />

      {/* 3. Celestial Horizon Arc (Inspired by Pin 2 - Vetra) */}
      <div 
        className="absolute top-[520px] sm:top-[600px] left-1/2 -translate-x-1/2 w-[140%] max-w-[1800px] h-[400px] pointer-events-none opacity-90"
        style={{
          background: `radial-gradient(
            ellipse 60% 45% at 50% 100%,
            rgba(249, 115, 22, 0.22) 0%,
            rgba(168, 85, 247, 0.16) 30%,
            rgba(14, 165, 233, 0.08) 55%,
            transparent 75%
          )`,
          filter: 'blur(40px)',
        }}
      />

      {/* 4. Subtle Micro-Stardust Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, #000000 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, #000000 40%, transparent 95%)'
        }}
      />

      {/* 5. Translucent Animated Watermark Logos (Few strategically positioned watermarks) */}
      {/* 5.1 Upper-Left Grand SDC Emblem Watermark */}
      <div className="absolute -top-12 -left-16 md:left-[-30px] w-72 h-72 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] pointer-events-none z-0 animate-watermark-drift">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Concentric radar rings */}
          <div className="absolute inset-0 rounded-full border border-white/[0.03] animate-watermark-spin-reverse" />
          <div className="absolute inset-8 rounded-full border border-dashed border-neon-purple/[0.04] animate-watermark-spin" />
          
          <img 
            src="/logo-sdc.svg" 
            alt="" 
            aria-hidden="true" 
            className="w-3/4 h-3/4 object-contain opacity-[0.04] md:opacity-[0.05] animate-watermark-spin select-none filter contrast-125"
          />
        </div>
      </div>

      {/* 5.2 Mid-Right Floating SDC Watermark */}
      <div className="absolute top-[38%] -right-16 md:right-[2%] w-60 h-60 sm:w-80 sm:h-80 md:w-[360px] md:h-[360px] pointer-events-none z-0 animate-watermark-drift-slow">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Outer dotted orbit */}
          <div className="absolute inset-4 rounded-full border border-dashed border-electric-cyan/[0.04] animate-watermark-spin" />
          
          <img 
            src="/logo-sdc.svg" 
            alt="" 
            aria-hidden="true" 
            className="w-2/3 h-2/3 object-contain opacity-[0.035] md:opacity-[0.045] animate-watermark-spin-reverse select-none filter contrast-125"
          />
        </div>
      </div>

      {/* 5.3 Lower-Left Technical Crest Watermark */}
      <div className="absolute bottom-[10%] left-[-10px] md:left-[4%] w-52 h-52 sm:w-72 sm:h-72 pointer-events-none z-0 animate-watermark-drift">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/[0.02] animate-watermark-spin" />
          <img 
            src="/logo-sdc.svg" 
            alt="" 
            aria-hidden="true" 
            className="w-2/3 h-2/3 object-contain opacity-[0.03] md:opacity-[0.04] select-none filter contrast-125 animate-watermark-breathe"
          />
        </div>
      </div>

      {/* 5.4 Subtle Floating Developer Glyphs (Watermark Micro-elements) */}
      <div className="absolute top-[24%] left-[20%] text-white opacity-[0.03] font-mono text-5xl md:text-7xl font-black select-none pointer-events-none animate-watermark-drift-slow">
        &lt;/&gt;
      </div>

      <div className="absolute top-[65%] right-[20%] text-white opacity-[0.03] font-mono text-4xl md:text-6xl font-black select-none pointer-events-none animate-watermark-drift">
        $_
      </div>

      <div className="absolute bottom-[22%] right-[8%] text-white opacity-[0.025] font-mono text-3xl md:text-5xl font-bold select-none pointer-events-none animate-watermark-breathe">
        {'{ SDC }'}
      </div>

      {/* 6. Top Horizon Edge Specular Shimmer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
    </div>
  );
};

