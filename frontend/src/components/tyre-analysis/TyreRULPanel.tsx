import React from "react";
import { CornerCliffStatus } from "../../types";
import { Clock, ShieldCheck, AlertTriangle, Zap } from "lucide-react";

interface TyreRULPanelProps {
  rulLaps: number;
  tyreAge: number;
  cliffLap: number;
  cliffStatus: CornerCliffStatus;
  healthPct: number;
}

export const TyreRULPanel: React.FC<TyreRULPanelProps> = ({
  rulLaps,
  tyreAge,
  cliffLap,
  cliffStatus,
  healthPct,
}) => {
  const maxLife = cliffLap + 4;
  const progressPct = Math.min(100, Math.max(0, Math.round((tyreAge / maxLife) * 100)));

  const getCliffStatusBadge = (status: CornerCliffStatus) => {
    switch (status) {
      case "POST_CLIFF":
        return {
          text: "POST-CLIFF (TERMINAL DECAY)",
          color: "text-[#FF0055]",
          bg: "bg-[#FF0055]/20 border-[#FF0055]",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FF0055]" />,
        };
      case "CLIFF_ONSET":
        return {
          text: "CLIFF ONSET (IMMEDIATE PIT)",
          color: "text-[#E10600]",
          bg: "bg-[#E10600]/20 border-[#E10600]",
          icon: <Zap className="w-3.5 h-3.5 text-[#E10600]" />,
        };
      case "APPROACHING_CLIFF":
        return {
          text: "APPROACHING CLIFF (WINDOW OPEN)",
          color: "text-[#FFB000]",
          bg: "bg-[#FFB000]/20 border-[#FFB000]",
          icon: <Clock className="w-3.5 h-3.5 text-[#FFB000]" />,
        };
      default:
        return {
          text: "PRE-CLIFF (OPTIMAL OPERATING)",
          color: "text-[#00E676]",
          bg: "bg-[#00E676]/20 border-[#00E676]",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />,
        };
    }
  };

  const cliffBadge = getCliffStatusBadge(cliffStatus);

  return (
    <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
        <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#00E5FF]" />
          <span>REMAINING USEFUL LIFE (RUL FORECAST)</span>
        </h3>
        <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[10px] font-black border ${cliffBadge.bg}`}>
          {cliffBadge.icon}
          <span>{cliffBadge.text}</span>
        </div>
      </div>

      {/* Prominent Laps Number */}
      <div className="flex items-baseline space-x-3">
        <span
          className={`text-4xl sm:text-5xl font-black tracking-tight ${
            rulLaps <= 3 ? "text-[#E10600] animate-pulse" : rulLaps <= 6 ? "text-[#FFB000]" : "text-[#00E5FF]"
          }`}
        >
          {rulLaps}
        </span>
        <span className="text-sm font-black text-[#9A9FA8] uppercase tracking-wider">
          USABLE LAPS REMAINING
        </span>
      </div>

      {/* RUL Stint Progression Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[#9A9FA8]">
          <span>TYRE STINT PROGRESSION</span>
          <span>
            LAP {tyreAge} OF ~{cliffLap} (CLIFF)
          </span>
        </div>

        <div className="w-full bg-[#1A1E27] h-3 rounded-full overflow-hidden p-0.5 border border-[#222733] relative">
          {/* Cliff Marker Line */}
          <div
            style={{ left: `${Math.round((cliffLap / maxLife) * 100)}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-[#FFB000] z-10"
            title={`Cliff onset lap: ${cliffLap}`}
          />
          <div
            style={{ width: `${progressPct}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              healthPct < 40 ? "bg-[#E10600]" : healthPct < 65 ? "bg-[#FFB000]" : "bg-[#00E676]"
            }`}
          />
        </div>
      </div>

      {/* Stint Metrics Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">PROJECTED USABLE WINDOW</span>
          <span className="text-white font-bold mt-0.5 block">{rulLaps} laps before critical wear</span>
        </div>

        <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">MODELED THERMAL CLIFF</span>
          <span className="text-[#FFB000] font-bold mt-0.5 block">Lap {cliffLap} of tyre age</span>
        </div>

        <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B] col-span-2 sm:col-span-1">
          <span className="text-[#606775] text-[10px] block">ESTIMATED RESIDUAL HEALTH</span>
          <span className="text-[#00E676] font-bold mt-0.5 block">{healthPct}% integrity</span>
        </div>
      </div>
    </div>
  );
};
