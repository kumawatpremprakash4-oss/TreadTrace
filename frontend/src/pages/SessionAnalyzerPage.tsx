import React, { useState, useEffect } from "react";
import { Upload, CheckCircle, Terminal } from "lucide-react";
import { LapData, SessionMeta } from "../types";

interface SessionAnalyzerPageProps {
  session: SessionMeta | null;
  laps: LapData[];
  onUploadSession: (file: File) => void;
}

export const SessionAnalyzerPage: React.FC<SessionAnalyzerPageProps> = ({
  session,
  laps,
  onUploadSession,
}) => {
  const [filterCompound, setFilterCompound] = useState<string>("ALL");
  const [filterValidity, setFilterValidity] = useState<string>("ALL");
  const [selectedLap, setSelectedLap] = useState<LapData | null>(laps[0] || null);

  // Reset selected lap whenever a new session is loaded (after upload or refresh)
  useEffect(() => {
    setSelectedLap(laps[0] || null);
    setFilterCompound("ALL");
    setFilterValidity("ALL");
  }, [laps]);

  const filteredLaps = laps.filter((lap) => {
    if (filterCompound !== "ALL" && lap.compound !== filterCompound) return false;
    if (filterValidity === "VALID_ONLY" && !lap.used_in_model) return false;
    if (filterValidity === "EXCLUDED_ONLY" && lap.used_in_model) return false;
    return true;
  });

  const getStatusBadge = (lap: LapData) => {
    const cls = lap.classification;
    if (cls === "GREEN_VALID" || cls === "VALID") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
          VALID
        </span>
      );
    }
    if (cls === "TRAFFIC") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30">
          TRAFFIC WAKE
        </span>
      );
    }
    if (cls.includes("PIT")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#222733] text-[#9A9FA8] border border-[#363E4F]">
          {cls}
        </span>
      );
    }
    if (cls === "YELLOW FLAG") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB000]/25 text-[#FFB000] border border-[#FFB000]">
          YELLOW FLAG
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E10600]/20 text-[#FF2A1A] border border-[#E10600]">
        OUTLIER
      </span>
    );
  };

  const getCompoundBadge = (compound: string) => {
    if (compound === "SOFT") return <span className="text-xs font-bold text-[#FF2A1A]">● SOFT C4</span>;
    if (compound === "MEDIUM") return <span className="text-xs font-bold text-[#FFB000]">● MEDIUM C3</span>;
    return <span className="text-xs font-bold text-[#F5F5F5]">● HARD C2</span>;
  };

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Session Forensics Title Bar */}
      <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E10600] animate-pulse" />
            <h1 className="text-lg font-black uppercase text-white tracking-tight">
              SESSION FORENSICS
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#17191D] border border-[#222733] text-[#00E5FF] text-[10px] font-bold">
              {session?.session_id || "FP2-SILVERSTONE-2026"}
            </span>
          </div>
        </div>

        {/* Upload Custom Telemetry */}
        <label className="flex items-center space-x-2 px-3.5 py-2 rounded bg-[#17191D] hover:bg-[#1E232B] text-white text-xs font-bold cursor-pointer border border-[#363E4F] transition-all self-start md:self-center">
          <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>INGEST TELEMETRY (CSV / JSON)</span>
          <input
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadSession(e.target.files[0]);
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forensic Telemetry Table */}
        <div className="lg:col-span-2 bg-[#101216] rounded-xl border border-[#222733] shadow-lg overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="p-3.5 border-b border-[#1E232B] flex flex-wrap items-center justify-between gap-3 bg-[#08090B]">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#606775]">COMPOUND:</span>
              {["ALL", "SOFT", "MEDIUM", "HARD"].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCompound(c)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    filterCompound === c
                      ? "bg-[#E10600] text-white shadow-[0_0_8px_rgba(225,6,0,0.5)]"
                      : "bg-[#17191D] text-[#9A9FA8] border border-[#222733] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#606775]">FILTER:</span>
              <select
                value={filterValidity}
                onChange={(e) => setFilterValidity(e.target.value)}
                className="text-xs border border-[#222733] rounded px-2 py-1 bg-[#17191D] text-white"
              >
                <option value="ALL">All Laps ({laps.length})</option>
                <option value="VALID_ONLY">Model Eligible Only</option>
                <option value="EXCLUDED_ONLY">Excluded Laps Only</option>
              </select>
            </div>
          </div>

          {/* Telemetry Rows */}
          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#08090B] sticky top-0 border-b border-[#1E232B] text-[#9A9FA8] font-bold z-10">
                <tr>
                  <th className="py-2.5 px-3">LAP</th>
                  <th className="py-2.5 px-3">STINT</th>
                  <th className="py-2.5 px-3">COMPOUND</th>
                  <th className="py-2.5 px-3">AGE</th>
                  <th className="py-2.5 px-3">LAP TIME</th>
                  <th className="py-2.5 px-3">FUEL</th>
                  <th className="py-2.5 px-3">TRACK °C</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">MODEL USE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181C24] font-mono">
                {filteredLaps.map((lap) => {
                  const isSelected = selectedLap?.lap_number === lap.lap_number;
                  return (
                    <tr
                      key={lap.lap_number}
                      onClick={() => setSelectedLap(lap)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#1E232B] border-l-4 border-[#E10600] font-bold"
                          : "hover:bg-[#15181E]"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-white font-black">L{lap.lap_number}</td>
                      <td className="py-2.5 px-3 text-[#9A9FA8]">S{lap.stint_id}</td>
                      <td className="py-2.5 px-3">{getCompoundBadge(lap.compound)}</td>
                      <td className="py-2.5 px-3 text-[#9A9FA8]">{lap.tyre_age}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{lap.lap_time.toFixed(3)}s</td>
                      <td className="py-2.5 px-3 text-[#606775]">{lap.fuel_load != null ? `${lap.fuel_load} kg` : '—'}</td>
                      <td className="py-2.5 px-3 text-[#606775]">{lap.track_temperature != null ? `${lap.track_temperature}°C` : '—'}</td>
                      <td className="py-2.5 px-3">{getStatusBadge(lap)}</td>
                      <td className="py-2.5 px-3">
                        {lap.used_in_model ? (
                          <span className="text-[#00E676] font-bold text-xs flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>YES</span>
                          </span>
                        ) : (
                          <span className="text-[#FF2A1A] font-bold text-xs">
                            EXCLUDED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lap Decomposition Trace Inspector */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
            <div>
              <span className="text-[10px] text-[#606775] font-bold uppercase tracking-widest block">
                FORENSIC DECOMPOSITION
              </span>
              <h2 className="text-base font-black text-white uppercase">
                {selectedLap ? `LAP ${selectedLap.lap_number} EVIDENCE` : "SELECT LAP"}
              </h2>
            </div>
            {selectedLap && getStatusBadge(selectedLap)}
          </div>

          {selectedLap ? (
            <div className="space-y-4 text-xs">
              {/* Observed vs Physical Breakdown */}
              <div className="p-3 rounded-lg bg-[#08090B] border border-[#1E232B] space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[#9A9FA8] text-[10px] uppercase">OBSERVED LAP TIME</span>
                  <span className="text-xl font-black text-white font-mono">
                    {selectedLap.lap_time.toFixed(3)} s
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#606775]">
                  <span>{selectedLap.compound} • AGE {selectedLap.tyre_age} LAPS</span>
                  <span>FUEL: {selectedLap.fuel_load != null ? `${selectedLap.fuel_load} KG` : '—'}</span>
                </div>
              </div>

              {/* Contributing Factor Traces */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#606775] font-bold uppercase tracking-wider block">
                  CONTRIBUTING FACTOR DELTAS
                </span>

                <div className="p-2.5 rounded bg-[#17191D] border border-[#1E232B] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#FF2A1A] font-bold">● TYRE DEGRADATION:</span>
                    <span className="text-white font-bold">
                      +{selectedLap.estimated_tyre_deg?.toFixed(3) || "0.000"} s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00E5FF] font-bold">● FUEL LOAD EFFECT:</span>
                    <span className="text-white font-bold">
                      +{selectedLap.estimated_fuel_effect?.toFixed(3) || "0.000"} s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#FFB000] font-bold">● TRAFFIC TURBULENCE:</span>
                    <span className="text-white font-bold">
                      +{selectedLap.estimated_traffic_effect?.toFixed(3) || "0.000"} s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00E676] font-bold">● TRACK RUBBER EVOLUTION:</span>
                    <span className="text-white font-bold">
                      {selectedLap.estimated_track_evo?.toFixed(3) || "0.000"} s
                    </span>
                  </div>
                  <div className="flex justify-between text-[#606775] pt-1 border-t border-[#222733]">
                    <span>● RESIDUAL NOISE / DRIVER:</span>
                    <span>
                      {selectedLap.residual_noise ? `${selectedLap.residual_noise > 0 ? "+" : ""}${selectedLap.residual_noise.toFixed(3)}` : "0.000"} s
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit Reason Box */}
              <div className="p-3.5 rounded bg-[#17191D] border border-[#363E4F] space-y-1">
                <div className="text-[10px] font-bold text-[#FFB000] uppercase tracking-wider flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-[#FFB000]" />
                  <span>CLASSIFIER AUDIT REASON</span>
                </div>
                <p className="text-[#9A9FA8] text-xs leading-relaxed">
                  {selectedLap.classification_reason || "Evaluated by data quality rule set."}
                </p>
                {selectedLap.estimated_penalty_seconds ? (
                  <span className="text-[#FF2A1A] font-bold block mt-1">
                    Penalty Incurred: +{selectedLap.estimated_penalty_seconds.toFixed(3)}s
                  </span>
                ) : null}
              </div>

              {/* Model Inclusion Gate */}
              <div className="p-3 rounded bg-[#08090B] border border-[#222733]">
                <span className="text-[#606775] block text-[10px] uppercase">DEGRADATION REGRESSION STATUS</span>
                <span className={`text-sm font-black mt-0.5 block ${selectedLap.used_in_model ? "text-[#00E676]" : "text-[#FF2A1A]"}`}>
                  {selectedLap.used_in_model ? "INCLUDED IN MODEL FIT" : "EXCLUDED FROM MODEL FIT"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#606775]">Select a lap to view forensic decomposition.</div>
          )}
        </div>
      </div>
    </div>
  );
};
