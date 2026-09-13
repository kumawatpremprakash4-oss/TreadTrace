import React from "react";
import { CornerStintHistory } from "../../types";
import { History, Flame, Activity, CheckCircle2 } from "lucide-react";

interface TyreStintHistoryProps {
  stints: CornerStintHistory[];
  cornerLabel: string;
}

export const TyreStintHistory: React.FC<TyreStintHistoryProps> = ({ stints, cornerLabel }) => {
  if (!stints || stints.length === 0) return null;

  return (
    <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
        <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
          <History className="w-4 h-4 text-[#00E5FF]" />
          <span>STINT TELEMETRY HISTORY ({cornerLabel})</span>
        </h3>
        <span className="text-[10px] text-[#606775] uppercase">{stints.length} RECORDED STINTS</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1E232B] text-[10px] text-[#606775] uppercase">
              <th className="py-2 px-3">STINT</th>
              <th className="py-2 px-3">SESSION</th>
              <th className="py-2 px-3">LAPS</th>
              <th className="py-2 px-3">AVG PACE</th>
              <th className="py-2 px-3">OBSERVED DEG</th>
              <th className="py-2 px-3">PEAK TEMP</th>
              <th className="py-2 px-3">VERDICT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1E27]">
            {stints.map((stint) => (
              <tr key={stint.stint_id} className="hover:bg-[#15181E] transition-colors">
                <td className="py-2.5 px-3 font-bold text-white">#{stint.stint_id}</td>
                <td className="py-2.5 px-3 text-[#9A9FA8]">{stint.session_id}</td>
                <td className="py-2.5 px-3 font-bold text-white">{stint.laps_completed} LAPS</td>
                <td className="py-2.5 px-3 text-white font-mono">{stint.avg_lap_time.toFixed(3)}s</td>
                <td className="py-2.5 px-3 text-[#FF2A1A] font-bold">
                  +{stint.observed_degradation_rate.toFixed(3)} s/lap
                </td>
                <td className="py-2.5 px-3 text-[#FFB000] flex items-center space-x-1">
                  <Flame className="w-3 h-3" />
                  <span>{stint.peak_temp}°C</span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-[#08090B] border border-[#222733] text-[10px] font-bold text-[#00E676]">
                    {stint.condition_verdict.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
