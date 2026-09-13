import React, { useEffect, useRef } from "react";

/**
 * Authentic Cinematic F1 Night Drift Background Animation.
 * Directly grounded in Reference Images 2 & 3:
 * - Ultra-high-fidelity Silverstone F1 night drift scene with authentic high-speed wheel motion blur
 * - High-speed wet asphalt optical flow & specular water reflection glimmers
 * - Red barrier chevron light pulses & trailing brake light streaks
 * - Real-time organic tyre smoke & water spray mist curling off the rear contact patch
 * - Flashing FIA rear safety rain light on diffuser
 * - Elegant motorsport readability gradient preserving hero text & CTAs
 */
export const HeroCinematicDriftBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Realistic Tyre Smoke & Ground Mist Particle
    interface MistParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      growth: number;
      alpha: number;
      maxAlpha: number;
      decay: number;
      hue: "white" | "red" | "cyan";
      rotation: number;
      vRot: number;
    }

    const particles: MistParticle[] = [];
    const loopDuration = 6.0;
    let startTime = performance.now();

    // Spawns natural wisps of tyre smoke and wet track spray behind the car
    const spawnMistPuff = (originX: number, originY: number, intensity: number) => {
      const count = Math.round(1 + intensity * 1.5);
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        const hue = rand < 0.22 ? "red" : rand < 0.35 ? "cyan" : "white";

        particles.push({
          x: originX + (Math.random() - 0.4) * 30,
          y: originY + (Math.random() - 0.5) * 18,
          vx: -(Math.random() * 2.8 + 1.6), // Rushes backward with the moving track
          vy: -(Math.random() * 0.7 + 0.1), // Gentle natural atmospheric lift
          size: Math.random() * 16 + 12,
          growth: Math.random() * 0.5 + 0.4,
          alpha: 0.02,
          maxAlpha: Math.min(0.26, 0.06 + intensity * 0.14),
          decay: Math.random() * 0.009 + 0.006,
          hue,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02,
        });
      }
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const cycleTime = elapsed % loopDuration;
      const normalized = cycleTime / loopDuration;

      ctx.clearRect(0, 0, width, height);

      // Continuous natural drift slip intensity
      const slipIntensity = 0.5 + 0.5 * Math.sin(normalized * Math.PI * 2);

      // Emitter positioned precisely at the rear tyre contact patch in screen space
      const emitterX = width * 0.52;
      const emitterY = height * 0.62;

      spawnMistPuff(emitterX, emitterY, slipIntensity);

      // Render realistic misty smoke particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += p.growth;
        p.rotation += p.vRot;

        if (p.alpha < p.maxAlpha) {
          p.alpha += 0.025;
        } else {
          p.alpha -= p.decay;
        }

        if (p.alpha <= 0 || p.x < -100 || p.y < -100) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const grad = ctx.createRadialGradient(0, 0, p.size * 0.1, 0, 0, p.size);
        if (p.hue === "red") {
          grad.addColorStop(0, "rgba(255, 60, 45, 0.7)");
          grad.addColorStop(0.5, "rgba(255, 30, 20, 0.25)");
          grad.addColorStop(1, "rgba(255, 0, 0, 0)");
        } else if (p.hue === "cyan") {
          grad.addColorStop(0, "rgba(100, 220, 255, 0.6)");
          grad.addColorStop(0.5, "rgba(0, 180, 255, 0.2)");
          grad.addColorStop(1, "rgba(0, 150, 255, 0)");
        } else {
          grad.addColorStop(0, "rgba(235, 240, 250, 0.65)");
          grad.addColorStop(0.45, "rgba(210, 220, 235, 0.22)");
          grad.addColorStop(1, "rgba(180, 195, 215, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#08090B]" aria-hidden="true">
      {/* =========================================================================
          AUTHENTIC F1 DRIFT SCENE: CAMERA TRACKING & HIGH-SPEED PAN
          ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="relative shrink-0 animate-hero-camera-track"
          style={{
            width: "max(100vw, calc(100vh * 16 / 9))",
            height: "max(100vh, calc(100vw * 9 / 16))",
          }}
        >
          {/* HIGH-RESOLUTION AUTHENTIC SILVERSTONE GP DRIFT BACKDROP */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/f1_hero_drift.jpg')",
            }}
          />

          {/* =====================================================================
              CONTINUOUS SPEED & OPTICAL FLOW OVERLAYS (AUTHENTIC LIGHT & ROAD FLOW)
              ===================================================================== */}
          {/* Track Surface Wet Asphalt Glint & Specular Reflection Motion */}
          <div
            className="absolute left-[15%] right-0 bottom-0 top-[45%] pointer-events-none mix-blend-screen opacity-40 animate-f1-road-surface-rush"
            style={{
              backgroundImage: `
                linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 52%, transparent 60%),
                repeating-linear-gradient(115deg, transparent 0px, transparent 45px, rgba(255,42,26,0.08) 45px, rgba(255,42,26,0.08) 55px)
              `,
              backgroundSize: "320px 200px",
              maskImage: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
            }}
          />

          {/* Track Barrier Red Neon Arrow Pulses (Accentuates the left barrier chevrons in Image 3) */}
          <div
            className="absolute top-[28%] left-[2%] w-[320px] h-[180px] pointer-events-none mix-blend-screen opacity-65 animate-f1-wheel-shimmer"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255, 30, 20, 0.45) 0%, rgba(255, 0, 0, 0) 70%)",
            }}
          />

          {/* Red Brake Light & Barrier Speed Trail (Streaming back across the right side) */}
          <div className="absolute top-[52%] right-[4%] w-[680px] h-[3px] bg-gradient-to-l from-transparent via-[#FF2A1A] to-transparent mix-blend-screen animate-hero-streak-1 drop-shadow-[0_0_12px_#FF2A1A]" />
          <div className="absolute top-[55%] right-[10%] w-[520px] h-[2px] bg-gradient-to-l from-transparent via-red-500 to-transparent mix-blend-screen animate-hero-streak-2 drop-shadow-[0_0_8px_#FF0000]" />
          <div className="absolute top-[48%] right-[18%] w-[440px] h-[2px] bg-gradient-to-l from-transparent via-cyan-400 to-transparent mix-blend-screen animate-hero-streak-3 drop-shadow-[0_0_8px_#00E5FF]" />

          {/* Silverstone Gantry Atmospheric Illumination Wash */}
          <div
            className="absolute top-[12%] right-[15%] w-[480px] h-[220px] pointer-events-none opacity-20 mix-blend-screen"
            style={{
              background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, rgba(0, 229, 255, 0.2) 40%, transparent 70%)",
            }}
          />

          {/* Authentic Flashing F1 Rear Safety Rain Light (4Hz pulse on rear wing/diffuser) */}
          <div
            className="absolute top-[42%] left-[45.2%] w-3 h-3 rounded-full bg-[#FF1A1A] pointer-events-none drop-shadow-[0_0_16px_#FF0000] animate-ping"
            style={{ animationDuration: "0.28s" }}
          />
          <div
            className="absolute top-[41.5%] left-[44.8%] w-5 h-5 rounded-full bg-red-600/60 blur-sm pointer-events-none"
          />

          {/* Ambient Diffuser Ground-Effect Red Reflection Glow */}
          <div
            className="absolute top-[58%] left-[48%] w-[380px] h-[160px] rounded-full bg-[#FF2A1A]/20 blur-[90px] animate-hero-smoke-pulse pointer-events-none"
          />
        </div>
      </div>

      {/* =========================================================================
          ORGANIC CANVAS PARTICLES: REAL-TIME DRIFT MIST & TYRE SMOKE
          ========================================================================= */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 opacity-70"
      />

      {/* =========================================================================
          PROTECTIVE DARK READABILITY VIGNETTE FOR HERO UI
          Guarantees 100% crisp typography on the left while keeping the car vivid
          ========================================================================= */}
      {/* Silky left-side dark motorsport gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/82 via-45% to-transparent pointer-events-none z-20" />

      {/* Top navigation & bottom telemetry edge fades */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#08090B] via-[#08090B]/60 to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#08090B] via-[#08090B]/75 to-transparent pointer-events-none z-20" />

      {/* Subtle Carbon Grid Texture Overlay */}
      <div className="absolute inset-0 bg-telemetry-grid pointer-events-none opacity-20 z-20" />
    </div>
  );
};
