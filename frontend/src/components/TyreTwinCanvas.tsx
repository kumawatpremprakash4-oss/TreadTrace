import React, { useEffect, useRef } from "react";

interface TyreTwinCanvasProps {
  compound: "SOFT" | "MEDIUM" | "HARD";
  tyreAge: number; // Laps completed
  maxLifeLaps?: number;
  healthPct: number;
}

export const TyreTwinCanvas: React.FC<TyreTwinCanvasProps> = ({
  compound,
  tyreAge,
  maxLifeLaps = 26,
  healthPct,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 120;
    const innerRadius = 70;

    // Determine compound base color
    const compoundStripeColor =
      compound === "SOFT" ? "#E10600" : compound === "MEDIUM" ? "#FFB000" : "#FFFFFF";

    // Wear factor: 0.0 (brand new) to 1.0 (past cliff)
    const wearRatio = Math.min(1.0, tyreAge / maxLifeLaps);

    const render = () => {
      rotation += 0.008; // Continuous slow rotation
      ctx.clearRect(0, 0, size, size);

      // 1. Heat Glow Aura behind tyre (shifts from dark carbon to hot blistering red)
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        outerRadius + 25
      );
      if (wearRatio < 0.5) {
        glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.05)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (wearRatio < 0.8) {
        glowGrad.addColorStop(0, "rgba(255, 176, 0, 0.18)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(225, 6, 0, 0.35)");
        glowGrad.addColorStop(1, "rgba(255, 42, 26, 0)");
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 25, 0, Math.PI * 2);
      ctx.fill();

      // 2. Tyre Outer Tread Surface (Dark vulcanized rubber with graining texture)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // Tread ring
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = "#15181E";
      ctx.fill();

      // Slotted tread ribs around circumference
      const numSlots = 36;
      ctx.strokeStyle = wearRatio > 0.7 ? "#2D3442" : "#222733";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < numSlots; i++) {
        const angle = (i * Math.PI * 2) / numSlots;
        const x1 = Math.cos(angle) * (innerRadius + 8);
        const y1 = Math.sin(angle) * (innerRadius + 8);
        const x2 = Math.cos(angle) * (outerRadius - 4);
        const y2 = Math.sin(angle) * (outerRadius - 4);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Compound Color Sidewall Stripe
      ctx.strokeStyle = compoundStripeColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius - 12, 0, Math.PI * 2);
      ctx.stroke();

      // Sidewall Branding Text along rim
      ctx.fillStyle = "#9A9FA8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`TREADTRACE • ${compound} • C3`, 0, -(outerRadius - 22));
      ctx.fillText(`ROTATION 320 KM/H`, 0, outerRadius - 18);

      ctx.restore();

      // 3. Wheel Rim & Centre Hub (Non-rotating or counter-rotating hub)
      const hubGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, innerRadius);
      hubGrad.addColorStop(0, "#222733");
      hubGrad.addColorStop(0.7, "#101216");
      hubGrad.addColorStop(1, "#08090B");
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Wheel nut
      ctx.fillStyle = "#E10600";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#F5F5F5";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Cross spokes
      ctx.strokeStyle = "#2A3140";
      ctx.lineWidth = 3;
      for (let s = 0; s < 5; s++) {
        const spAngle = (s * Math.PI * 2) / 5 + rotation * 0.4;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(spAngle) * 16, centerY + Math.sin(spAngle) * 16);
        ctx.lineTo(centerX + Math.cos(spAngle) * (innerRadius - 4), centerY + Math.sin(spAngle) * (innerRadius - 4));
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [compound, tyreAge, maxLifeLaps, healthPct]);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <canvas ref={canvasRef} className="drop-shadow-[0_0_20px_rgba(225,6,0,0.25)]" />
      <div className="absolute bottom-2 text-center font-mono">
        <span className="text-[10px] uppercase tracking-wider text-[#9A9FA8] block">
          Digital Twin State
        </span>
        <span
          className={`text-xs font-black tracking-widest ${
            healthPct > 65
              ? "text-[#00E676]"
              : healthPct > 35
              ? "text-[#FFB000]"
              : "text-[#E10600] animate-pulse"
          }`}
        >
          {healthPct}% RUL • LAP {tyreAge}
        </span>
      </div>
    </div>
  );
};
