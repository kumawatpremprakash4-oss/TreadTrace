import React, { useEffect, useRef } from "react";
import { CornerRiskState } from "../../types";

interface TyreTwinVisualizerProps {
  compound: "SOFT" | "MEDIUM" | "HARD";
  tyreAge: number;
  maxLifeLaps?: number;
  healthPct: number;
  riskState: CornerRiskState;
  cornerPosition: string;
}

export const TyreTwinVisualizer: React.FC<TyreTwinVisualizerProps> = ({
  compound,
  tyreAge,
  maxLifeLaps = 26,
  healthPct,
  riskState,
  cornerPosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    const size = 320;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 125;
    const innerRadius = 72;

    const compoundStripeColor =
      compound === "SOFT" ? "#E10600" : compound === "MEDIUM" ? "#FFB000" : "#FFFFFF";

    const wearRatio = Math.min(1.0, tyreAge / maxLifeLaps);

    const render = () => {
      rotation += 0.008;
      ctx.clearRect(0, 0, size, size);

      // 1. Heat Glow Aura behind tyre
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        outerRadius + 30
      );

      if (riskState === "FAILURE_RISK") {
        glowGrad.addColorStop(0, "rgba(255, 0, 85, 0.45)");
        glowGrad.addColorStop(1, "rgba(255, 0, 85, 0)");
      } else if (riskState === "CRITICAL" || wearRatio >= 0.8) {
        glowGrad.addColorStop(0, "rgba(225, 6, 0, 0.4)");
        glowGrad.addColorStop(1, "rgba(225, 6, 0, 0)");
      } else if (riskState === "WARNING" || wearRatio >= 0.5) {
        glowGrad.addColorStop(0, "rgba(255, 176, 0, 0.22)");
        glowGrad.addColorStop(1, "rgba(255, 176, 0, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.08)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 30, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rotating Tread Surface
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // Tread ring
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = wearRatio > 0.75 ? "#111317" : "#16191F";
      ctx.fill();

      // Tread wear slots around circumference
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

      // Sidewall stripe
      ctx.strokeStyle = compoundStripeColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius - 12, 0, Math.PI * 2);
      ctx.stroke();

      // Sidewall branding
      ctx.fillStyle = "#9A9FA8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`TREADTRACE • ${cornerPosition} • ${compound}`, 0, -(outerRadius - 22));
      ctx.fillText(`ROTATION 315 KM/H`, 0, outerRadius - 18);

      ctx.restore();

      // 3. Wheel Rim & Centre Hub
      const hubGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, innerRadius);
      hubGrad.addColorStop(0, "#222733");
      hubGrad.addColorStop(0.7, "#101216");
      hubGrad.addColorStop(1, "#08090B");
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Wheel nut
      ctx.fillStyle = cornerPosition.endsWith("L") ? "#E10600" : "#00E5FF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // 5 Cross spokes
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
  }, [compound, tyreAge, maxLifeLaps, healthPct, riskState, cornerPosition]);

  return (
    <div className="flex flex-col items-center justify-center relative select-none font-mono">
      <canvas ref={canvasRef} className="drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-2 text-center">
        <span className="text-[10px] uppercase tracking-wider text-[#9A9FA8] block">
          {cornerPosition} DIGITAL TWIN
        </span>
        <span
          className={`text-xs font-black tracking-widest ${
            healthPct > 65
              ? "text-[#00E676]"
              : healthPct > 40
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
