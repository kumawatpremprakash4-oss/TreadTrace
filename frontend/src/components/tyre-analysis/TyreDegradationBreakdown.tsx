import React from "react";
import { DegradationBreakdown } from "../../types";
import { Layers, Activity, Flame, Compass, Zap } from "lucide-react";

interface TyreDegradationBreakdownProps {
  breakdown: DegradationBreakdown;
  cornerLabel: string;
}

export const TyreDegradationBreakdown: React.FC<TyreDegradationBreakdownProps> = ({
  breakdown,
  cornerLabel,
}) => {
  const items = [
    {
      label: "INTRINSIC RUBBER WEAR",
      value: breakdown.intrinsic_wear_sec,
      icon: <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />,
      desc: "Baseline chemical abrasive compound decay per lap",
      color: "text-[#00E5FF]",
      barColor: "bg-[#00E5FF]",
    },
    {
      label: "THERMAL STRESS PENALTY",
      value: breakdown.thermal_stress_sec,
      icon: <Flame className="w-3.5 h-3.5 text-[#FFB000]" />,
      desc: "Performance deficit induced by operating above compound optimum",
      color: "text-[#FFB000]",
      barColor: "bg-[#FFB000]",
    },
    {
      label: "CORNER LOAD ASYMMETRY",
      value: breakdown.corner_load_bias_sec,
      icon: <Compass className="w-3.5 h-3.5 text-[#FF2A1A]" />,
      desc: "Silverstone lateral scrub & traction distribution shear",
      color: "text-[#FF2A1A]",
      barColor: "bg-[#FF2A1A]",
    },
    {
      label: "CLIFF ACCELERATION",
      value: breakdown.cliff_acceleration_sec,
      icon: <Zap className="w-3.5 h-3.5 text-[#FF0055]" />,
      desc: "Non-linear structural delamination once past thermal cliff",
      color: "text-[#FF0055]",
      barColor: "bg-[#FF0055]",
    },
  ];

  const total = breakdown.total_performance_loss_sec || 0.001;

  return (
    <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
        <div>
          <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#00E5FF]" />
            <span>DEGRADATION CONTRIBUTORS (MODEL BREAKDOWN)</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#606775] block uppercase">TOTAL LOSS</span>
          <span className="text-lg font-black text-[#FF2A1A]">
            +{breakdown.total_performance_loss_sec.toFixed(3)}s
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const sharePct = Math.round((Math.max(0, item.value) / Math.max(0.001, total)) * 100);
          return (
            <div key={idx} className="p-3 rounded bg-[#08090B] border border-[#1E232B] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-bold text-white tracking-wide">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-black ${item.color}`}>
                    +{item.value.toFixed(3)}s
                  </span>
                  <span className="text-[10px] text-[#606775]">({sharePct}%)</span>
                </div>
              </div>

              {/* Share visual bar */}
              <div className="w-full bg-[#1A1E27] h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, sharePct)}%` }}
                  className={`h-full rounded-full ${item.barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
