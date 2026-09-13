import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Layers, Sparkles, Zap, Terminal } from "lucide-react";
import { ConfounderSummary } from "../types";
import { SignatureIsolateInteraction } from "../components/SignatureIsolateInteraction";

interface ConfounderLabPageProps {
  confounderData: ConfounderSummary | null;
}

export const ConfounderLabPage: React.FC<ConfounderLabPageProps> = ({ confounderData }) => {
  const laps = confounderData?.decomposed_laps || [];
  const [selectedLapNumber, setSelectedLapNumber] = useState<number>(14);

  const selectedLap = laps.find((l) => l.lap_number === selectedLapNumber) || laps[0];

  const chartData = laps.slice(0, 32).map((lap) => ({
    lap: `L${lap.lap_number}`,
    lapNum: lap.lap_number,
    compound: lap.compound,
    TyreDeg: lap.estimated_tyre_deg || 0,
    FuelEffect: lap.estimated_fuel_effect || 0,
    TrackEvo: lap.estimated_track_evo || 0,
    TrafficPenalty: lap.estimated_traffic_effect || 0,
    Residual: lap.residual_noise || 0,
    Observed: lap.lap_time,
  }));

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Title Bar */}
      <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
            <h1 className="text-lg font-black uppercase text-white tracking-tight">
              CONFOUNDER DETECTION ENGINE
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#17191D] border border-[#222733] text-[#FF2A1A] text-[10px] font-bold">
              MODEL ESTIMATE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2.5 rounded bg-[#08090B] border border-[#222733]">
            <span className="text-[#606775] block text-[10px]">FUEL SENSITIVITY:</span>
            <span className="font-bold text-white">
              +{confounderData?.learned_fuel_sensitivity_sec_per_kg || 0.033} s / kg
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#08090B] border border-[#222733]">
            <span className="text-[#606775] block text-[10px]">MAX TRACK EVOLUTION:</span>
            <span className="font-bold text-[#00E676]">
              -{confounderData?.max_track_evolution_gain_sec || 0.55} s Grip Gain
            </span>
          </div>
        </div>
      </div>

      {/* Signature Action */}
      <SignatureIsolateInteraction
        fuelSens={confounderData?.learned_fuel_sensitivity_sec_per_kg || 0.033}
        trackEvoGain={confounderData?.max_track_evolution_gain_sec || 0.55}
        degRate={0.041}
      />

      {/* Waterfall & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2 bg-[#101216] rounded-xl border border-[#222733] shadow-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E232B] pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                LAP-BY-LAP MULTIVARIATE DECOMPOSITION
              </h2>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-[#E10600] rounded-xs" /><span className="text-white">Tyre</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-[#00E5FF] rounded-xs" /><span className="text-white">Fuel</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-[#00E676] rounded-xs" /><span className="text-white">Track</span></span>
              <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-[#FFB000] rounded-xs" /><span className="text-white">Traffic</span></span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedLapNumber(e.activePayload[0].payload.lapNum);
                  }
                }}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E232B" />
                <XAxis dataKey="lap" stroke="#606775" fontSize={10} />
                <YAxis stroke="#606775" fontSize={10} unit="s" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#08090B] border border-[#222733] text-white p-3 rounded-lg text-xs shadow-2xl space-y-1 font-mono">
                          <div className="font-bold text-[#00E5FF]">{label} • Observed: {data.Observed.toFixed(3)}s</div>
                          <div className="text-[#FF2A1A]">● Tyre Wear: +{data.TyreDeg.toFixed(3)}s</div>
                          <div className="text-[#00E5FF]">● Fuel Penalty: +{data.FuelEffect.toFixed(3)}s</div>
                          <div className="text-[#00E676]">● Track Evolution: {data.TrackEvo.toFixed(3)}s</div>
                          {data.TrafficPenalty > 0 && (
                            <div className="text-[#FFB000]">● Traffic Wake: +{data.TrafficPenalty.toFixed(3)}s</div>
                          )}
                          <div className="text-[#606775]">● Residual: {data.Residual.toFixed(3)}s</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#222733" />
                <Bar dataKey="TyreDeg" fill="#E10600" stackId="a" name="Tyre Wear" />
                <Bar dataKey="FuelEffect" fill="#00E5FF" stackId="a" name="Fuel Mass" />
                <Bar dataKey="TrafficPenalty" fill="#FFB000" stackId="a" name="Traffic" />
                <Bar dataKey="TrackEvo" fill="#00E676" name="Track Grip" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Lap Forensic Inspector */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E232B] pb-3">
            <div>
              <span className="text-[10px] text-[#606775] font-bold uppercase tracking-widest block">
                DECOMPOSITION EVIDENCE
              </span>
              <h3 className="text-base font-black text-white uppercase">
                LAP {selectedLap?.lap_number || 14} AUDIT
              </h3>
            </div>
            <select
              value={selectedLapNumber}
              onChange={(e) => setSelectedLapNumber(Number(e.target.value))}
              className="text-xs border border-[#222733] rounded px-2 py-1 bg-[#17191D] text-white"
            >
              {laps.map((l) => (
                <option key={l.lap_number} value={l.lap_number}>
                  Lap {l.lap_number} ({l.compound})
                </option>
              ))}
            </select>
          </div>

          {selectedLap ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-[#08090B] border border-[#1E232B] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#606775] uppercase block">OBSERVED TIME</span>
                  <span className="text-lg font-black text-white">{selectedLap.lap_time.toFixed(3)} s</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#606775] uppercase block">COMPOUND</span>
                  <span className="text-sm font-bold text-[#FFB000]">
                    {selectedLap.compound} (AGE {selectedLap.tyre_age})
                  </span>
                </div>
              </div>

              {/* Waterfall Trace Box */}
              <div className="divide-y divide-[#181C24] border border-[#1E232B] rounded-lg overflow-hidden">
                <div className="p-2.5 bg-[#17191D] flex items-center justify-between text-white font-bold">
                  <span>Base Pace (Clean Track, 0 Fuel)</span>
                  <span>{selectedLap.base_performance?.toFixed(3) || "87.850"} s</span>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[#FF2A1A] bg-[#E10600]/10">
                  <span className="font-bold">+ True Tyre Degradation</span>
                  <span className="font-black">+{selectedLap.estimated_tyre_deg?.toFixed(3) || "0.000"} s</span>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[#00E5FF]">
                  <span>+ Fuel Mass ({selectedLap.fuel_load} kg)</span>
                  <span className="font-bold">+{selectedLap.estimated_fuel_effect?.toFixed(3) || "0.000"} s</span>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[#FFB000]">
                  <span>+ Traffic Dirty Air Delta</span>
                  <span className="font-bold">+{selectedLap.estimated_traffic_effect?.toFixed(3) || "0.000"} s</span>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[#00E676]">
                  <span>- Track Rubbering Grip Gain</span>
                  <span className="font-bold">{selectedLap.estimated_track_evo?.toFixed(3) || "0.000"} s</span>
                </div>
              </div>

              {/* Confounder Explanation Box */}
              <div className="p-3.5 rounded bg-[#17191D] border border-[#363E4F] space-y-1">
                <div className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>AI CONFOUNDER ISOLATION NOTE</span>
                </div>
                <p className="text-[#9A9FA8] text-xs leading-relaxed">
                  "Approximately <strong className="text-white">+{selectedLap.estimated_tyre_deg?.toFixed(3)}s</strong> of observed performance loss is attributed to tyre degradation after isolating {selectedLap.fuel_load}kg fuel weight and track evolution."
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
