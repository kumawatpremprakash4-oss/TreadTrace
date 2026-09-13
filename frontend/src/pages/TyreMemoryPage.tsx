import React, { useState } from "react";
import { Database, ShieldCheck, Thermometer, Clock, History, FileText, Cpu, Sliders, Flame } from "lucide-react";
import { TyreTwin } from "../types";
import { TyreTwinCanvas } from "../components/TyreTwinCanvas";

interface TyreMemoryPageProps {
  tyreTwins: TyreTwin[];
}

export const TyreMemoryPage: React.FC<TyreMemoryPageProps> = ({ tyreTwins }) => {
  const [selectedTyreId, setSelectedTyreId] = useState<string>(
    tyreTwins[0]?.tyre_id || "SET-M01-FP2"
  );
  const [scrubAge, setScrubAge] = useState<number>(14);

  const selectedTwin = tyreTwins.find((t) => t.tyre_id === selectedTyreId) || tyreTwins[0];

  const getCompoundStyle = (compound: string) => {
    if (compound === "SOFT") return "bg-[#E10600]/20 text-[#FF2A1A] border-[#E10600]/40";
    if (compound === "MEDIUM") return "bg-[#FFB000]/20 text-[#FFB000] border-[#FFB000]/40";
    return "bg-white/10 text-white border-white/40";
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Title Bar */}
      <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
            <h1 className="text-lg font-black uppercase text-white tracking-tight">
              TYRE MEMORY &amp; DIGITAL GARAGE
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#17191D] border border-[#222733] text-[#00E676] text-[10px] font-bold">
              DIGITAL TWIN REPOSITORY
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#9A9FA8] bg-[#08090B] px-3 py-1.5 rounded-lg border border-[#222733]">
          <Cpu className="w-4 h-4 text-[#00E5FF]" />
          <span>{tyreTwins.length} ALLOCATIONS ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tyre Allocation Roster */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] shadow-lg p-4 space-y-3">
          <span className="text-[10px] font-bold text-[#606775] uppercase tracking-widest block">
            ALLOCATED TYRE SETS
          </span>

          <div className="space-y-2">
            {tyreTwins.map((twin) => {
              const isSelected = twin.tyre_id === selectedTyreId;
              return (
                <div
                  key={twin.tyre_id}
                  onClick={() => {
                    setSelectedTyreId(twin.tyre_id);
                    setScrubAge(twin.accumulated_laps);
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#E10600] bg-[#17191D] shadow-[0_0_12px_rgba(225,6,0,0.3)]"
                      : "border-[#222733] hover:border-[#363E4F] bg-[#08090B]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{twin.tyre_id}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCompoundStyle(
                          twin.compound
                        )}`}
                      >
                        {twin.compound}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#00E676]">
                      {twin.current_health_pct}% RUL
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-[#9A9FA8]">
                    <span>{twin.accumulated_laps} LAPS • {twin.heat_cycles} CYCLES</span>
                    <span className="text-[#FF2A1A] font-bold">
                      {twin.estimated_degradation_rate.toFixed(3)} s/lap
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Digital Twin Inspection & Interactive Tyre Simulation */}
        <div className="lg:col-span-2 space-y-5">
          {selectedTwin ? (
            <>
              {/* Twin Visual Hub Card */}
              <div className="bg-[#101216] rounded-xl border border-[#222733] shadow-lg p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#1E232B] pb-6">
                  {/* Rotating Tyre Visual Canvas */}
                  <div className="flex-shrink-0">
                    <TyreTwinCanvas
                      compound={selectedTwin.compound}
                      tyreAge={scrubAge}
                      maxLifeLaps={selectedTwin.compound === "SOFT" ? 18 : selectedTwin.compound === "MEDIUM" ? 28 : 40}
                      healthPct={Math.max(5, Math.round(100 - (scrubAge / 28) * 95))}
                    />
                  </div>

                  {/* Twin State Instruments */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-xl font-black text-white">{selectedTwin.tyre_id}</h2>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border ${getCompoundStyle(
                              selectedTwin.compound
                            )}`}
                          >
                            {selectedTwin.compound}
                          </span>
                        </div>
                        <span className="text-xs text-[#9A9FA8] mt-0.5 block">
                          SET #{selectedTwin.allocation_set} • {selectedTwin.initial_condition}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#606775] block uppercase">MODEL CONFIDENCE</span>
                        <span className="text-xl font-black text-[#00E676]">
                          {selectedTwin.confidence_score}%
                        </span>
                      </div>
                    </div>

                    {/* Interactive Scrubbing Slider */}
                    <div className="p-3.5 rounded bg-[#08090B] border border-[#222733] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#9A9FA8] flex items-center space-x-1">
                          <Sliders className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>SCRUB TYRE ACCUMULATED AGE:</span>
                        </span>
                        <span className="text-[#00E5FF] font-bold">{scrubAge} LAPS</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={scrubAge}
                        onChange={(e) => setScrubAge(Number(e.target.value))}
                        className="w-full accent-[#E10600] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#606775]">
                        <span>0 LAPS (SCRUBBED)</span>
                        <span>15 LAPS</span>
                        <span>30 LAPS (CLIFF)</span>
                      </div>
                    </div>

                    {/* Core Metric Pills */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-[#17191D] border border-[#222733]">
                        <span className="text-[#606775] block text-[10px]">HEAT CYCLES</span>
                        <span className="text-white font-bold">{selectedTwin.heat_cycles}</span>
                      </div>
                      <div className="p-2.5 rounded bg-[#17191D] border border-[#222733]">
                        <span className="text-[#606775] block text-[10px]">WEAR RATE</span>
                        <span className="text-[#FF2A1A] font-bold">
                          {selectedTwin.estimated_degradation_rate.toFixed(4)} s/lap
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#17191D] border border-[#222733]">
                        <span className="text-[#606775] block text-[10px]">PEAK TEMP</span>
                        <span className="text-[#FFB000] font-bold">{selectedTwin.peak_track_temp}°C</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stint History Timeline */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                    <History className="w-4 h-4 text-[#00E5FF]" />
                    <span>RECORDED STINT TIMELINE &amp; THERMAL PROFILE</span>
                  </div>

                  <div className="space-y-2">
                    {selectedTwin.stint_history.map((stint, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-[#08090B] border border-[#1E232B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            {stint.session_id} • STINT #{stint.stint_id}
                          </span>
                          <span className="text-[#9A9FA8] text-[11px] block mt-0.5">
                            {stint.laps_completed} Laps completed • Avg Pace: {stint.avg_lap_time}s
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                          <div>
                            <span className="text-[10px] text-[#606775] block">OBSERVED WEAR</span>
                            <span className="font-bold text-[#E10600]">
                              {stint.observed_degradation_rate.toFixed(4)} s/lap
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#606775] block">PEAK TEMP</span>
                            <span className="font-bold text-white">{stint.peak_track_temp}°C</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Evidence & Audit Trail */}
                <div className="mt-5 pt-4 border-t border-[#1E232B] space-y-2">
                  <span className="text-[10px] text-[#606775] font-bold uppercase tracking-wider block">
                    MODEL EVIDENCE &amp; MEMORY AUDIT NOTES
                  </span>
                  <div className="space-y-1.5 text-xs text-[#9A9FA8]">
                    {selectedTwin.model_evidence_notes.map((note, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#17191D] border border-[#222733]">
                        • {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
