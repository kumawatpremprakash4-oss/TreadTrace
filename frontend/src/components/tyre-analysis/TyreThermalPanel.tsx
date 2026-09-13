import React from "react";
import { ThermalState } from "../../types";
import { Flame, Thermometer, AlertCircle, CheckCircle2 } from "lucide-react";

interface TyreThermalPanelProps {
  currentTemp: number;
  optimalTemp: number;
  tempDelta: number;
  thermalState: ThermalState;
  compound: string;
}

export const TyreThermalPanel: React.FC<TyreThermalPanelProps> = ({
  currentTemp,
  optimalTemp,
  tempDelta,
  thermalState,
  compound,
}) => {
  const getThermalConfig = (state: ThermalState) => {
    switch (state) {
      case "CRITICAL":
        return {
          textColor: "text-[#E10600]",
          barColor: "bg-[#E10600]",
          icon: <AlertCircle className="w-4 h-4 text-[#E10600]" />,
          label: "CRITICAL OVERHEAT",
          description: "Thermal blister threshold exceeded. Rapid carcass degradation active.",
        };
      case "STRESSED":
        return {
          textColor: "text-[#FFB000]",
          barColor: "bg-[#FFB000]",
          icon: <Flame className="w-4 h-4 text-[#FFB000]" />,
          label: "THERMALLY STRESSED",
          description: "Operating above optimum working range. Tyre cooling tactics advised.",
        };
      case "WARM":
        return {
          textColor: "text-[#00E5FF]",
          barColor: "bg-[#00E5FF]",
          icon: <Thermometer className="w-4 h-4 text-[#00E5FF]" />,
          label: "WARM (UPPER WORKING WINDOW)",
          description: "Acceptable thermal operating window with minor graining risk.",
        };
      default:
        return {
          textColor: "text-[#00E676]",
          barColor: "bg-[#00E676]",
          icon: <CheckCircle2 className="w-4 h-4 text-[#00E676]" />,
          label: "OPTIMAL TEMPERATURE",
          description: "Tyre core and tread operating within ideal grip and wear window.",
        };
    }
  };

  const config = getThermalConfig(thermalState);
  // Thermal load percentage relative to max operating threshold (~115°C)
  const loadPercentage = Math.min(100, Math.max(0, Math.round(((currentTemp - 40) / (115 - 40)) * 100)));

  return (
    <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
        <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
          <Flame className="w-4 h-4 text-[#FFB000]" />
          <span>THERMAL CONDITION & CARCASS STRESS</span>
        </h3>
        <span className="text-[10px] text-[#606775] uppercase">{compound} COMPOUND TARGET</span>
      </div>

      {/* Temperature Gauge Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">CURRENT TEMP</span>
          <span className="text-lg font-black text-white mt-0.5 block">{currentTemp}°C</span>
        </div>

        <div className="p-3 rounded bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">TARGET OPTIMUM</span>
          <span className="text-lg font-black text-[#00E676] mt-0.5 block">{optimalTemp}°C</span>
        </div>

        <div className="p-3 rounded bg-[#08090B] border border-[#1E232B]">
          <span className="text-[#606775] text-[10px] block">DEVIATION</span>
          <span className={`text-lg font-black mt-0.5 block ${tempDelta > 8 ? "text-[#E10600]" : "text-[#FFB000]"}`}>
            {tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C
          </span>
        </div>
      </div>

      {/* Thermal Load Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9A9FA8] text-[11px]">THERMAL LOAD METER</span>
          <span className="font-bold text-white text-[11px]">{loadPercentage}% CAPACITY</span>
        </div>
        <div className="w-full bg-[#1A1E27] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#222733]">
          <div
            style={{ width: `${loadPercentage}%` }}
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
          />
        </div>
      </div>

      {/* Status Verdict */}
      <div className="p-3 rounded bg-[#08090B] border border-[#1E232B] flex items-start space-x-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="space-y-0.5 text-xs">
          <span className={`font-black uppercase tracking-wider block ${config.textColor}`}>
            STATUS: {config.label}
          </span>
          <p className="text-[#9A9FA8] text-[11px] leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
};
