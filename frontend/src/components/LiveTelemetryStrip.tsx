import React, { useState, useEffect } from "react";
import { Activity, Flame, Wind, Fuel, Radio, Gauge } from "lucide-react";

export const LiveTelemetryStrip: React.FC = () => {
  // Live simulated micro-jitter to make data feel streaming and alive
  const [pulse, setPulse] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const trackTemp = (38.2 + Math.sin(pulse) * 0.3).toFixed(1);
  const airTemp = 24.5;
  const currentFuel = (58.4 - (pulse * 0.02) % 4).toFixed(1);
  const tyreHealth = Math.max(65, 84 - (pulse % 6));

  const items = [
    { label: "SESSION", value: "FP2 • SILVERSTONE GP", highlight: false },
    { label: "CAR", value: "#23 A. ALBON", highlight: false },
    { label: "CURRENT LAP", value: `LAP 18 / 48`, highlight: true, color: "text-[#00E5FF]" },
    { label: "TYRE SET", value: "SET-M01 (MEDIUM C3)", highlight: true, color: "text-[#FFB000]" },
    { label: "TYRE AGE", value: "14 LAPS", highlight: false },
    { label: "FUEL CELL", value: `${currentFuel} KG`, highlight: false },
    { label: "TRACK TEMP", value: `${trackTemp} °C`, highlight: true, color: "text-[#FF2A1A]" },
    { label: "AIR TEMP", value: `${airTemp} °C`, highlight: false },
    { label: "TRAFFIC", value: "CLEAN AIR (GAP +3.2s)", highlight: true, color: "text-[#00E676]" },
    { label: "TYRE HEALTH", value: `${tyreHealth}% RUL`, highlight: true, color: "text-[#00E676]" },
    { label: "ISOLATED DEG", value: "0.041 s/LAP", highlight: true, color: "text-[#FF2A1A]" },
    { label: "CLIFF ONSET", value: "LAP 26 (IN 8 LAPS)", highlight: true, color: "text-[#FFB000]" },
  ];

  return (
    <div className="bg-[#0b0d12]/95 backdrop-blur-sm border-y border-[#1E232B] text-[11px] font-mono select-none overflow-hidden py-1.5 flex items-center shadow-inner relative">
      {/* Live System Indicator */}
      <div className="flex items-center space-x-2 px-4 border-r border-[#1E232B] bg-[#08090B] z-10 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse-fast shadow-[0_0_8px_#E10600]" />
        <span className="text-[#F5F5F5] font-black tracking-wider uppercase">PIT WALL TELEMETRY</span>
        <span className="text-[#00E676] font-bold text-[9px] px-1.5 py-0.2 bg-[#00E676]/10 border border-[#00E676]/30 rounded shadow-[0_0_6px_rgba(0,230,118,0.2)]">
          LIVE
        </span>
      </div>

      {/* Marquee Ticker Stream */}
      <div className="overflow-hidden whitespace-nowrap flex-1 flex">
        <div className="animate-ticker flex items-center space-x-6 text-[#9A9FA8] pl-4">
          {items.concat(items).map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5">
              <span className="text-[#606775] uppercase text-[10px] tracking-wider">{item.label}:</span>
              <span className={`font-bold transition-all duration-300 ${item.color || "text-[#F5F5F5]"}`}>
                {item.value}
              </span>
              <span className="text-[#222733] ml-3">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
