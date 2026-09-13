import React from "react";
import { CornerTyreState } from "../../types";
import { ShieldAlert, AlertTriangle, CheckCircle, Flame, Calendar, Activity, Database } from "lucide-react";

interface TyreHeaderProps {
  tyre: CornerTyreState;
  onSelectPosition: (position: any) => void;
}

export const TyreHeader: React.FC<TyreHeaderProps> = ({ tyre, onSelectPosition }) => {
  const getStatusBadge = (state: string) => {
    switch (state) {
      case "FAILURE_RISK":
        return {
          bg: "bg-[#FF0055]/20 border-[#FF0055] text-[#FF0055]",
          icon: <ShieldAlert className="w-4 h-4 text-[#FF0055]" />,
          text: "FAILURE RISK",
        };
      case "CRITICAL":
        return {
          bg: "bg-[#E10600]/20 border-[#E10600] text-[#FF2A1A]",
          icon: <AlertTriangle className="w-4 h-4 text-[#FF2A1A]" />,
          text: "CRITICAL",
        };
      case "WARNING":
        return {
          bg: "bg-[#FFB000]/20 border-[#FFB000] text-[#FFB000]",
          icon: <AlertTriangle className="w-4 h-4 text-[#FFB000]" />,
          text: "WARNING",
        };
      default:
        return {
          bg: "bg-[#00E676]/20 border-[#00E676] text-[#00E676]",
          icon: <CheckCircle className="w-4 h-4 text-[#00E676]" />,
          text: "OPTIMAL",
        };
    }
  };

  const badge = getStatusBadge(tyre.risk_state);

  return (
    <div className="bg-[#101216] rounded-xl p-5 sm:p-6 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E232B] pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xl sm:text-2xl font-black text-white tracking-wider">
              {tyre.position} — {tyre.position_label}
            </span>
            <span
              style={{ borderColor: tyre.compound_color, color: tyre.compound_color }}
              className="px-2.5 py-0.5 rounded text-xs font-black border bg-[#08090B]"
            >
              {tyre.compound} {tyre.compound_code}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#9A9FA8]">
            <span>TYRE ID: <strong className="text-white">{tyre.tyre_id}</strong></span>
            <span>•</span>
            <span>ALLOCATION: <strong className="text-[#00E5FF]">{tyre.parent_set_id}</strong></span>
            <span>•</span>
            <span>AXIS: <strong className="text-white">{tyre.axis} ({tyre.side})</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-black ${badge.bg}`}>
            {badge.icon}
            <span>{badge.text}</span>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Age */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">AGE</span>
          <span className="text-lg font-black text-white mt-0.5 block">
            {tyre.accumulated_laps} <span className="text-[10px] font-normal text-[#9A9FA8]">LAPS</span>
          </span>
        </div>

        {/* Health */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">HEALTH</span>
          <span
            className={`text-lg font-black mt-0.5 block ${
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

        {/* RUL */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">RUL</span>
          <span className="text-lg font-black text-[#00E5FF] mt-0.5 block">
            {tyre.remaining_useful_life} <span className="text-[10px] font-normal text-[#9A9FA8]">LAPS</span>
          </span>
        </div>

        {/* Degradation Rate */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">DEGRADATION</span>
          <span className="text-lg font-black text-[#FF2A1A] mt-0.5 block">
            +{tyre.estimated_degradation_rate.toFixed(3)}{" "}
            <span className="text-[10px] font-normal text-[#9A9FA8]">s/lap</span>
          </span>
        </div>

        {/* Heat Cycles */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">HEAT CYCLES</span>
          <span className="text-lg font-black text-[#FFB000] mt-0.5 block">
            {tyre.heat_cycles} <span className="text-[10px] font-normal text-[#9A9FA8]">CYCLES</span>
          </span>
        </div>

        {/* Peak Track Temp */}
        <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">PEAK TRACK TEMP</span>
          <span className="text-lg font-black text-white mt-0.5 block flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-[#FFB000]" />
            <span>{tyre.peak_track_temp}°C</span>
          </span>
        </div>
      </div>
    </div>
  );
};
