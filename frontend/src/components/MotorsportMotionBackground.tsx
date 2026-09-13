import React from "react";

/**
 * Continuous high-performance F1 motion background.
 * Layers:
 *  - Distant circuit atmosphere & parallax glow (Slow)
 *  - Perspective 3D racetrack corridor flowing forward toward/underneath the viewer (Continuous loop)
 *  - Multi-speed velocity streaks (Fast foreground, Medium midground)
 *  - Dark center readability vignette ensuring 100% telemetry legibility
 */
export const MotorsportMotionBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#07080A]"
      aria-hidden="true"
    >
      {/* =========================================================================
          LAYER 4: DISTANT MOTORSPORT ATMOSPHERE & PARALLAX GLOW (SLOW)
          ========================================================================= */}
      {/* Deep Navy/Cobalt Racing Night Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-[#080B10] to-[#040507]" />

      {/* Ambient Red Bull Racing-Inspired Cobalt Energy Drift (Top Left) */}
      <div className="absolute -top-36 -left-36 w-[640px] h-[640px] rounded-full bg-[#002D62]/30 blur-[140px] animate-f1-ambient-slow" />

      {/* Racing Red Thermal Under-Glow (Right Flank) */}
      <div
        className="absolute top-1/4 -right-36 w-[580px] h-[580px] rounded-full bg-[#E10600]/14 blur-[160px] animate-f1-ambient-slow"
        style={{ animationDelay: "-9s" }}
      />

      {/* Subtle Electric Cyan Telemetry Accent Glow */}
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full bg-[#00E5FF]/6 blur-[130px]" />

      {/* =========================================================================
          LAYER 2: PERSPECTIVE 3D RACETRACK CORRIDOR (FORWARD MOTION UNDERNEATH)
          ========================================================================= */}
      {/* 3D Perspective Stage centered at bottom half of screen */}
      <div className="absolute inset-x-0 bottom-0 h-[62vh] overflow-hidden flex justify-center [perspective:550px] [perspective-origin:50%_15%]">
        {/* The 3D Ground Road Runway */}
        <div className="relative w-[1100px] h-full origin-top [transform:rotateX(74deg)] overflow-hidden">
          {/* Dark Tarmac Surface Base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D14] via-[#0F141E] to-[#07090D] border-x border-[#2A3445]/40" />

          {/* Continuous Forward-Moving Track Runway (Seamless 3D Optical Flow) */}
          {/* Segment 1 */}
          <div className="absolute inset-x-0 h-[48%] animate-f1-track-pass-1 flex justify-between px-6">
            {/* Left Kerb: Alternating Red/White */}
            <div className="w-10 h-full f1-kerb-pattern border-r border-white/60" />
            {/* Left Lane Markings */}
            <div className="w-1.5 h-full f1-dash-stripe-left" />
            {/* Center High-Speed Chevrons */}
            <div className="w-16 h-full flex flex-col items-center justify-around opacity-75">
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
            </div>
            {/* Right Lane Markings */}
            <div className="w-1.5 h-full f1-dash-stripe-right" />
            {/* Right Kerb: Alternating Red/White */}
            <div className="w-10 h-full f1-kerb-pattern border-l border-white/60" />
          </div>

          {/* Segment 2 (Offset by 0.35s) */}
          <div
            className="absolute inset-x-0 h-[48%] animate-f1-track-pass-2 flex justify-between px-6"
            style={{ animationDelay: "0.35s" }}
          >
            <div className="w-10 h-full f1-kerb-pattern border-r border-white/60" />
            <div className="w-1.5 h-full f1-dash-stripe-left" />
            <div className="w-16 h-full flex flex-col items-center justify-around opacity-75">
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
            </div>
            <div className="w-1.5 h-full f1-dash-stripe-right" />
            <div className="w-10 h-full f1-kerb-pattern border-l border-white/60" />
          </div>

          {/* Segment 3 (Offset by 0.70s) */}
          <div
            className="absolute inset-x-0 h-[48%] animate-f1-track-pass-3 flex justify-between px-6"
            style={{ animationDelay: "0.70s" }}
          >
            <div className="w-10 h-full f1-kerb-pattern border-r border-white/60" />
            <div className="w-1.5 h-full f1-dash-stripe-left" />
            <div className="w-16 h-full flex flex-col items-center justify-around opacity-75">
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
            </div>
            <div className="w-1.5 h-full f1-dash-stripe-right" />
            <div className="w-10 h-full f1-kerb-pattern border-l border-white/60" />
          </div>

          {/* Segment 4 (Offset by 1.05s) */}
          <div
            className="absolute inset-x-0 h-[48%] animate-f1-track-pass-4 flex justify-between px-6"
            style={{ animationDelay: "1.05s" }}
          >
            <div className="w-10 h-full f1-kerb-pattern border-r border-white/60" />
            <div className="w-1.5 h-full f1-dash-stripe-left" />
            <div className="w-16 h-full flex flex-col items-center justify-around opacity-75">
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
              <span className="text-[#00E5FF] font-black text-xl tracking-tighter scale-y-150 drop-shadow-[0_0_8px_#00E5FF]">▲</span>
            </div>
            <div className="w-1.5 h-full f1-dash-stripe-right" />
            <div className="w-10 h-full f1-kerb-pattern border-l border-white/60" />
          </div>

          {/* Outer Road Edge Neon Light Guides */}
          <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-[#00E5FF] to-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
          <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-[#E10600] to-[#E10600] shadow-[0_0_12px_#E10600]" />
        </div>
      </div>

      {/* =========================================================================
          LAYER 3: MULTI-SPEED TRACK LIGHTS & HIGH-SPEED VELOCITY STREAKS
          ========================================================================= */}
      {/* Fast Foreground Light Streaks (Streaming across screen edges) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Left Peripheral Speed Streaks */}
        <div className="absolute top-[22%] left-0 w-80 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent animate-f1-streak-fast-1 drop-shadow-[0_0_8px_#00E5FF]" />
        <div className="absolute top-[48%] left-0 w-96 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent animate-f1-streak-fast-2 drop-shadow-[0_0_10px_#FFFFFF]" />
        <div className="absolute top-[72%] left-0 w-72 h-[2px] bg-gradient-to-r from-transparent via-[#E10600] to-transparent animate-f1-streak-fast-3 drop-shadow-[0_0_8px_#E10600]" />

        {/* Right Peripheral Speed Streaks */}
        <div className="absolute top-[30%] right-0 w-96 h-[2.5px] bg-gradient-to-l from-transparent via-[#00E5FF] to-transparent animate-f1-streak-fast-right-1 drop-shadow-[0_0_8px_#00E5FF]" />
        <div className="absolute top-[60%] right-0 w-80 h-[3px] bg-gradient-to-l from-transparent via-[#FFB000] to-transparent animate-f1-streak-fast-right-2 drop-shadow-[0_0_10px_#FFB000]" />
        <div className="absolute top-[82%] right-0 w-64 h-[2px] bg-gradient-to-l from-transparent via-white to-transparent animate-f1-streak-fast-right-3 drop-shadow-[0_0_8px_#FFFFFF]" />

        {/* Midground Telemetry Streamers */}
        <div className="absolute top-[15%] inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent animate-f1-tracer-mid-1" />
        <div className="absolute top-[85%] inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E10600]/35 to-transparent animate-f1-tracer-mid-2" />
      </div>

      {/* =========================================================================
          LAYER 5: SUBTLE TELEMETRY GRID FLOW
          ========================================================================= */}
      <div className="absolute inset-0 bg-telemetry-grid opacity-20 animate-grid-flow" />

      {/* =========================================================================
          READABILITY VIGNETTE OVERLAY
          Ensures the central dashboard cards, charts, and 3D car retain 100% crisp contrast
          ========================================================================= */}
      {/* Vertical Gradient (Protects Header and Footer) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07080A]/85 via-[#07080A]/30 to-[#07080A]/90" />

      {/* Radial Vignette (Keeps the active working area dark & readable while edges stream with speed) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(7,8,10,0.6)_25%,_rgba(7,8,10,0.92)_90%)]" />
    </div>
  );
};
