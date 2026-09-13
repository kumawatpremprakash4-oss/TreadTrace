import React from "react";
import { CornerPosition, CornerTyreState } from "../../types";
import { Flame, ShieldAlert, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface VehicleTyreOverviewProps {
  tyres: Record<CornerPosition, CornerTyreState>;
  selectedPosition: CornerPosition;
  onSelectPosition: (position: CornerPosition) => void;
}

export const VehicleTyreOverview: React.FC<VehicleTyreOverviewProps> = ({
  tyres,
  selectedPosition,
  onSelectPosition,
}) => {
  const cornerOrder: CornerPosition[] = ["FL", "FR", "RL", "RR"];

  const getStatusVisual = (state: string) => {
    switch (state) {
      case "FAILURE_RISK":
        return {
          badgeBg: "bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]",
          dotColor: "bg-[#FF0055] animate-ping",
          borderHover: "hover:border-[#FF0055]",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FF0055]" />,
          label: "FAILURE RISK",
        };
      case "CRITICAL":
        return {
          badgeBg: "bg-[#E10600]/20 text-[#FF2A1A] border-[#E10600]",
          dotColor: "bg-[#E10600] animate-pulse",
          borderHover: "hover:border-[#E10600]",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FF2A1A]" />,
          label: "CRITICAL",
        };
      case "WARNING":
        return {
          badgeBg: "bg-[#FFB000]/20 text-[#FFB000] border-[#FFB000]",
          dotColor: "bg-[#FFB000]",
          borderHover: "hover:border-[#FFB000]",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FFB000]" />,
          label: "WARNING",
        };
      default:
        return {
          badgeBg: "bg-[#00E676]/20 text-[#00E676] border-[#00E676]",
          dotColor: "bg-[#00E676]",
          borderHover: "hover:border-[#00E676]",
          icon: <CheckCircle className="w-3.5 h-3.5 text-[#00E676]" />,
          label: "OPTIMAL",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono select-none">
      {cornerOrder.map((pos) => {
        const tyre = tyres[pos];
        if (!tyre) return null;

        const isSelected = selectedPosition === pos;
        const visual = getStatusVisual(tyre.risk_state);

        return (
          <div
            key={pos}
            onClick={() => onSelectPosition(pos)}
            className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
              isSelected
                ? "bg-gradient-to-b from-[#131824] to-[#0F1218] border-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.22)] ring-1 ring-[#00E5FF]/40 -translate-y-0.5"
                : `bg-[#101216] border-[#222733] opacity-85 hover:opacity-100 hover:-translate-y-0.5 ${visual.borderHover} hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]`
            }`}
          >
            {/* Top selection accent */}
            {isSelected && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#00E5FF]" />
            )}

            {/* Corner Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${visual.dotColor}`} />
                <span className="font-black text-white text-sm tracking-wider">
                  {pos} • {tyre.position_label}
                </span>
              </div>

              <div
                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black border ${visual.badgeBg}`}
              >
                {visual.icon}
                <span>{visual.label}</span>
              </div>
            </div>

            {/* Health & Wear Progress */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9A9FA8]">HEALTH</span>
                <span
                  className={`font-black text-sm ${
                    tyre.current_health_pct > 65
                      ? "text-[#00E676]"
                      : tyre.current_health_pct > 40
                      ? "text-[#FFB000]"
                      : "text-[#E10600]"
                  }`}
                >
                  {tyre.current_health_pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#1A1E27] h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${tyre.current_health_pct}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    tyre.current_health_pct > 65
                      ? "bg-[#00E676]"
                      : tyre.current_health_pct > 40
                      ? "bg-[#FFB000]"
                      : "bg-[#E10600]"
                  }`}
                />
              </div>
            </div>

            {/* Key Corner Metrics */}
            <div className="mt-3 pt-3 border-t border-[#1E232B] grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#606775] text-[10px] block">RUL</span>
                <span className="text-white font-bold">{tyre.remaining_useful_life} LAPS</span>
              </div>

              <div>
                <span className="text-[#606775] text-[10px] block">TEMP</span>
                <span className="text-white font-bold flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-[#FFB000]" />
                  <span>{tyre.current_temperature}°C</span>
                </span>
              </div>

              <div>
                <span className="text-[#606775] text-[10px] block">RATE</span>
                <span className="text-[#FF2A1A] font-bold">
                  +{tyre.estimated_degradation_rate.toFixed(3)}s
                </span>
              </div>

              <div>
                <span className="text-[#606775] text-[10px] block">CLIFF</span>
                <span className="text-[#9A9FA8] font-bold">LAP {tyre.cliff_lap}</span>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-3 pt-2 border-t border-[#1E232B] flex items-center justify-between text-[10px] text-[#606775] group-hover:text-[#00E5FF] transition-colors">
              <span>{isSelected ? "ACTIVE SELECTION" : "CLICK TO INSPECT"}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
