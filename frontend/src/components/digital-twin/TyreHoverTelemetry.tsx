import React from "react";
import { CornerTyreState } from "../../types";
import { ShieldAlert, AlertTriangle, CheckCircle, Flame } from "lucide-react";

interface TyreHoverTelemetryProps {
  tyre: CornerTyreState;
  screenPos: { x: number; y: number };
}

export const TyreHoverTelemetry: React.FC<TyreHoverTelemetryProps> = ({ tyre, screenPos }) => {
  const getStatusBadge = (state: string) => {
    switch (state) {
      case "FAILURE_RISK":
        return {
          bg: "bg-[#FF0055]/20 border-[#FF0055] text-[#FF0055]",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FF0055]" />,
          text: "FAILURE RISK",
        };
      case "CRITICAL":
        return {
          bg: "bg-[#E10600]/20 border-[#E10600] text-[#FF2A1A]",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FF2A1A]" />,
          text: "CRITICAL",
        };
      case "WARNING":
        return {
          bg: "bg-[#FFB000]/20 border-[#FFB000] text-[#FFB000]",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#FFB000]" />,
          text: "WARNING",
        };
      default:
        return {
          bg: "bg-[#00E676]/20 border-[#00E676] text-[#00E676]",
          icon: <CheckCircle className="w-3.5 h-3.5 text-[#00E676]" />,
          text: "OPTIMAL",
        };
    }
  };

  const badge = getStatusBadge(tyre.risk_state);

  return (
    <div
      style={{
        left: `${screenPos.x + 16}px`,
        top: `${screenPos.y - 40}px`,
      }}
      className="fixed z-50 pointer-events-none w-64 bg-[#0B0D12]/95 backdrop-blur-md rounded-lg border border-[#2A313F] shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-3.5 font-mono select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E232B] pb-2 mb-2.5">
        <div>
          <span className="text-xs font-black text-white tracking-wider block">
            {tyre.position_label}
          </span>
          <span className="text-[10px] text-[#00E5FF] font-bold">
            {tyre.compound} {tyre.compound_code}
          </span>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-black border ${badge.bg}`}>
          {badge.icon}
          <span>{badge.text}</span>
        </div>
      </div>

      {/* 2-column Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-[#12151B] p-1.5 rounded border border-[#1A1E27]">
          <span className="text-[#606775] block text-[9px]">TYRE AGE</span>
          <span className="text-white font-bold text-xs">{tyre.accumulated_laps} LAPS</span>
        </div>

        <div className="bg-[#12151B] p-1.5 rounded border border-[#1A1E27]">
          <span className="text-[#606775] block text-[9px]">HEALTH</span>
          <span
            className={`font-black text-xs ${
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

        <div className="bg-[#12151B] p-1.5 rounded border border-[#1A1E27]">
          <span className="text-[#606775] block text-[9px]">DEGRADATION</span>
          <span className="text-[#FF2A1A] font-bold">
            +{tyre.estimated_degradation_rate.toFixed(3)} s/lap
          </span>
        </div>

        <div className="bg-[#12151B] p-1.5 rounded border border-[#1A1E27]">
          <span className="text-[#606775] block text-[9px]">TEMPERATURE</span>
          <span className="text-white font-bold flex items-center space-x-1">
            <Flame className="w-3 h-3 text-[#FFB000]" />
            <span>{tyre.current_temperature}°C</span>
          </span>
        </div>
      </div>

      {/* RUL Footer */}
      <div className="mt-2.5 pt-2 border-t border-[#1E232B] flex items-center justify-between text-[10px]">
        <span className="text-[#9A9FA8]">REMAINING LIFE:</span>
        <span className="text-[#00E5FF] font-black">{tyre.remaining_useful_life} LAPS</span>
      </div>
    </div>
  );
};
